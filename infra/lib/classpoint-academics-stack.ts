import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ClasspointAcademicsStackProps extends StackProps {
  envName: string;
  apiId: string;
}

export class ClasspointAcademicsStack extends Stack {
  constructor(scope: Construct, id: string, props: ClasspointAcademicsStackProps) {
    super(scope, id, props);

    const { envName, apiId } = props;
    Tags.of(this).add('environment', envName);
    const removalPolicy = envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    const tenantGuard = `
  #if($ctx.info.parentTypeName == "Mutation")
    #if(!$ctx.identity || !$ctx.identity.claims)
      $util.unauthorized()
    #end
  #end
  #if($ctx.identity && $ctx.identity.claims)
    #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
    #if($tenantSchool && $ctx.args.schoolId && $tenantSchool != $ctx.args.schoolId)
      $util.unauthorized()
    #end
    #if($tenantSchool && $ctx.args.input && $ctx.args.input.schoolId && $tenantSchool != $ctx.args.input.schoolId)
      $util.unauthorized()
    #end
  #end
`;

    const schoolSetupStatesTable = new dynamodb.Table(this, 'SchoolSetupStatesTable', {
      partitionKey: { name: 'schoolId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy
    });

    schoolSetupStatesTable.addGlobalSecondaryIndex({
      indexName: 'bySchoolSetup',
      partitionKey: { name: 'schoolId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING }
    });

    const setupStateRole = new iam.Role(this, 'SchoolSetupStatesRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com')
    });
    schoolSetupStatesTable.grantReadWriteData(setupStateRole);

    const setupStateDataSource = new appsync.CfnDataSource(this, 'SchoolSetupStatesDS', {
      apiId,
      name: 'SchoolSetupStatesDS',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: {
        tableName: schoolSetupStatesTable.tableName,
        awsRegion: Stack.of(this).region
      },
      serviceRoleArn: setupStateRole.roleArn
    });

    const createSetupStateRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "stateJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.stateJson),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "conditionExpression": "attribute_not_exists(id)"
}`;

    const updateSetupStateRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET stateJson = :stateJson, updatedAt = :updatedAt",
    "expressionValues": {
      ":stateJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.stateJson),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

    const setupStateBySchoolRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolSetup",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "scanIndexForward": false,
  "limit": $util.defaultIfNull($ctx.args.limit, 5)
}`;

    const createSetupStateResolver = new appsync.CfnResolver(this, 'CreateSchoolSetupStateResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createSchoolSetupState',
      dataSourceName: 'SchoolSetupStatesDS',
      requestMappingTemplate: createSetupStateRequest,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const updateSetupStateResolver = new appsync.CfnResolver(this, 'UpdateSchoolSetupStateResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'updateSchoolSetupState',
      dataSourceName: 'SchoolSetupStatesDS',
      requestMappingTemplate: updateSetupStateRequest,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const setupStateBySchoolResolver = new appsync.CfnResolver(this, 'SetupStateBySchoolResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'setupStateBySchool',
      dataSourceName: 'SchoolSetupStatesDS',
      requestMappingTemplate: setupStateBySchoolRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    createSetupStateResolver.addDependsOn(setupStateDataSource);
    updateSetupStateResolver.addDependsOn(setupStateDataSource);
    setupStateBySchoolResolver.addDependsOn(setupStateDataSource);

    const attendanceSessionsByClassAndDayRequest = tenantGuard + `
#set($tenantSchool = "")
#if($ctx.identity && $ctx.identity.claims)
  #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byClassDay",
  "query": {
    "expression": "classGroupId = :cid and #date = :date",
    "expressionNames": { "#date": "date" },
    "expressionValues": {
      ":cid": $util.dynamodb.toDynamoDBJson($ctx.args.classGroupId),
      ":date": $util.dynamodb.toDynamoDBJson($ctx.args.date)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`;

    new appsync.CfnResolver(this, 'AttendanceSessionsByClassAndDayResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'attendanceSessionsByClassAndDay',
      dataSourceName: 'AttendanceSessionsDS',
      requestMappingTemplate: attendanceSessionsByClassAndDayRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    const attendanceEntriesBySessionRequest = tenantGuard + `
#set($tenantSchool = "")
#if($ctx.identity && $ctx.identity.claims)
  #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byAttendanceSession",
  "query": {
    "expression": "attendanceSessionId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.attendanceSessionId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`;

    new appsync.CfnResolver(this, 'AttendanceEntriesBySessionResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'attendanceEntriesBySession',
      dataSourceName: 'AttendanceEntriesDS',
      requestMappingTemplate: attendanceEntriesBySessionRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    const assessmentPoliciesBySchoolRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolPolicy",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`;

    new appsync.CfnResolver(this, 'AssessmentPoliciesBySchoolResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'assessmentPoliciesBySchool',
      dataSourceName: 'AssessmentPoliciesDS',
      requestMappingTemplate: assessmentPoliciesBySchoolRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    const assessmentsByClassSubjectTermRequest = tenantGuard + `
#set($tenantSchool = "")
#if($ctx.identity && $ctx.identity.claims)
  #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
#end
#set($filterParts = [])
#if($tenantSchool)
  $util.qr($filterParts.add("schoolId = :tsid"))
#end
#if($ctx.args.termId)
  $util.qr($filterParts.add("termId = :termId"))
#end
#set($filterExpression = "")
#if($filterParts.size() > 0)
  #set($filterExpression = $util.join(" and ", $filterParts))
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byClassSubjectTerm",
  "query": {
    "expression": "classGroupId = :cid and subjectId = :sid",
    "expressionValues": {
      ":cid": $util.dynamodb.toDynamoDBJson($ctx.args.classGroupId),
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.subjectId)
    }
  },
#if($filterExpression != "")
  "filter": {
    "expression": $util.toJson($filterExpression),
    "expressionValues": {
      #if($ctx.args.termId)
      ":termId": $util.dynamodb.toDynamoDBJson($ctx.args.termId)#if($tenantSchool),#end
      #end
      #if($tenantSchool)
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
      #end
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`;

    new appsync.CfnResolver(this, 'AssessmentsByClassSubjectTermResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'assessmentsByClassSubjectTerm',
      dataSourceName: 'AssessmentsDS',
      requestMappingTemplate: assessmentsByClassSubjectTermRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    const scoresByAssessmentRequest = tenantGuard + `
#set($tenantSchool = "")
#if($ctx.identity && $ctx.identity.claims)
  #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byAssessment",
  "query": {
    "expression": "assessmentId = :aid",
    "expressionValues": {
      ":aid": $util.dynamodb.toDynamoDBJson($ctx.args.assessmentId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`;

    new appsync.CfnResolver(this, 'ScoresByAssessmentResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'scoresByAssessment',
      dataSourceName: 'ScoreEntriesDS',
      requestMappingTemplate: scoresByAssessmentRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    const subjectsBySchoolRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolSubject",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`;

    new appsync.CfnResolver(this, 'SubjectsBySchoolResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'subjectsBySchool',
      dataSourceName: 'SubjectsDS',
      requestMappingTemplate: subjectsBySchoolRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    const subjectsByClassYearRequest = tenantGuard + `
#set($tenantSchool = "")
#if($ctx.identity && $ctx.identity.claims)
  #set($tenantSchool = $ctx.identity.claims.get("custom:schoolId"))
#end
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byClassYear",
  "query": {
    "expression": "classYearId = :cid",
    "expressionValues": {
      ":cid": $util.dynamodb.toDynamoDBJson($ctx.args.classYearId)
    }
  },
#if($tenantSchool)
  "filter": {
    "expression": "schoolId = :tsid",
    "expressionValues": {
      ":tsid": $util.dynamodb.toDynamoDBJson($tenantSchool)
    }
  },
#end
  "limit": $util.defaultIfNull($ctx.args.limit, 200)
}`;

    new appsync.CfnResolver(this, 'SubjectsByClassYearResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'subjectsByClassYear',
      dataSourceName: 'ClassSubjectsDS',
      requestMappingTemplate: subjectsByClassYearRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    const createSubjectRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "code": $util.dynamodb.toDynamoDBJson($ctx.args.input.code),
    "levelType": $util.dynamodb.toDynamoDBJson($ctx.args.input.levelType)
  }
}`;

    new appsync.CfnResolver(this, 'CreateSubjectResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createSubject',
      dataSourceName: 'SubjectsDS',
      requestMappingTemplate: createSubjectRequest,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const updateSubjectRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "code": $util.dynamodb.toDynamoDBJson($ctx.args.input.code),
    "levelType": $util.dynamodb.toDynamoDBJson($ctx.args.input.levelType)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`;

    new appsync.CfnResolver(this, 'UpdateSubjectResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'updateSubject',
      dataSourceName: 'SubjectsDS',
      requestMappingTemplate: updateSubjectRequest,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const deleteSubjectRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

    new appsync.CfnResolver(this, 'DeleteSubjectResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'deleteSubject',
      dataSourceName: 'SubjectsDS',
      requestMappingTemplate: deleteSubjectRequest,
      responseMappingTemplate: '$util.toJson(true)'
    });

    const createClassSubjectRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "classYearId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classYearId),
    "subjectId": $util.dynamodb.toDynamoDBJson($ctx.args.input.subjectId),
    "isCompulsory": $util.dynamodb.toDynamoDBJson($ctx.args.input.isCompulsory)
  }
}`;

    new appsync.CfnResolver(this, 'CreateClassSubjectResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createClassSubject',
      dataSourceName: 'ClassSubjectsDS',
      requestMappingTemplate: createClassSubjectRequest,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const updateClassSubjectRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "attributeValues": {
    "classYearId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classYearId),
    "subjectId": $util.dynamodb.toDynamoDBJson($ctx.args.input.subjectId),
    "isCompulsory": $util.dynamodb.toDynamoDBJson($ctx.args.input.isCompulsory)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`;

    new appsync.CfnResolver(this, 'UpdateClassSubjectResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'updateClassSubject',
      dataSourceName: 'ClassSubjectsDS',
      requestMappingTemplate: updateClassSubjectRequest,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const deleteClassSubjectRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

    new appsync.CfnResolver(this, 'DeleteClassSubjectResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'deleteClassSubject',
      dataSourceName: 'ClassSubjectsDS',
      requestMappingTemplate: deleteClassSubjectRequest,
      responseMappingTemplate: '$util.toJson(true)'
    });

    const featuresBySchoolRequest = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolFeature",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 50)
}`;

    new appsync.CfnResolver(this, 'FeaturesBySchoolResolver', {
      apiId,
      typeName: 'Query',
      fieldName: 'featuresBySchool',
      dataSourceName: 'FeatureFlagsDS',
      requestMappingTemplate: featuresBySchoolRequest,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    // Mutations: attendance/assessments (simple puts)
    const attendanceSessionPut = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.id, $util.autoId()))
  },
  "attributeValues": {
    "termId": $util.dynamodb.toDynamoDBJson($ctx.args.input.termId),
    "classGroupId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classGroupId),
    "date": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.date, "")),
    "takenByUserId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.takenByUserId, "")),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
},
  "returnValues": "ALL_NEW"
}`;
    new appsync.CfnResolver(this, 'CreateAttendanceSessionResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createAttendanceSession',
      dataSourceName: 'AttendanceSessionsDS',
      requestMappingTemplate: attendanceSessionPut,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const attendanceEntryPut = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.id, $util.autoId()))
  },
  "attributeValues": {
    "attendanceSessionId": $util.dynamodb.toDynamoDBJson($ctx.args.input.attendanceSessionId),
    "studentId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.studentId, "")),
    "status": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.status, "PRESENT")),
    "notes": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.notes, "")),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
},
  "returnValues": "ALL_NEW"
}`;
    new appsync.CfnResolver(this, 'CreateAttendanceEntryResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createAttendanceEntry',
      dataSourceName: 'AttendanceEntriesDS',
      requestMappingTemplate: attendanceEntryPut,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const assessmentPut = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.id, $util.autoId()))
  },
  "attributeValues": {
    "termId": $util.dynamodb.toDynamoDBJson($ctx.args.input.termId),
    "classGroupId": $util.dynamodb.toDynamoDBJson($ctx.args.input.classGroupId),
    "subjectId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.subjectId, "")),
    "policyId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.policyId, "")),
    "title": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.title, "")),
    "status": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.status, "OPEN")),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
},
  "returnValues": "ALL_NEW"
}`;
    new appsync.CfnResolver(this, 'CreateAssessmentResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createAssessment',
      dataSourceName: 'AssessmentsDS',
      requestMappingTemplate: assessmentPut,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const scoreEntryPut = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.id, $util.autoId()))
  },
  "attributeValues": {
    "assessmentId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.assessmentId, "")),
    "studentId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.studentId, "")),
    "scoresJson": $util.dynamodb.toDynamoDBJson($util.toJson($ctx.args.input.scoresJson)),
    "totalScore": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.totalScore, 0)),
    "grade": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.grade, "")),
    "enteredByUserId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.enteredByUserId, "")),
    "enteredAt": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.enteredAt, $util.time.nowISO8601())),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
},
  "returnValues": "ALL_NEW"
}`;
    new appsync.CfnResolver(this, 'CreateScoreEntryResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createScoreEntry',
      dataSourceName: 'ScoreEntriesDS',
      requestMappingTemplate: scoreEntryPut,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const updateScoreEntry = tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #scoresJson = :scores, #totalScore = :total, #grade = :grade, #studentId = :studentId, #assessmentId = :assessmentId, #updatedAt = :now",
    "expressionNames": {
      "#scoresJson": "scoresJson",
      "#totalScore": "totalScore",
      "#grade": "grade",
      "#studentId": "studentId",
      "#assessmentId": "assessmentId",
      "#updatedAt": "updatedAt"
    },
    "expressionValues": {
      ":scores": $util.dynamodb.toDynamoDBJson($util.toJson($ctx.args.input.scoresJson)),
      ":total": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.totalScore, 0)),
      ":grade": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.grade, "")),
      ":studentId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.studentId, "")),
      ":assessmentId": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.args.input.assessmentId, "")),
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

    new appsync.CfnResolver(this, 'UpdateScoreEntryResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'updateScoreEntry',
      dataSourceName: 'ScoreEntriesDS',
      requestMappingTemplate: updateScoreEntry,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const lockAssessment = (status: string) => tenantGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  },
  "update": {
    "expression": "SET #status = :status, #updatedAt = :now",
    "expressionNames": { "#status": "status", "#updatedAt": "updatedAt" },
    "expressionValues": {
      ":status": $util.dynamodb.toDynamoDBJson("${status}"),
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

    new appsync.CfnResolver(this, 'LockAssessmentResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'lockAssessment',
      dataSourceName: 'AssessmentsDS',
      requestMappingTemplate: lockAssessment('LOCKED'),
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    new appsync.CfnResolver(this, 'UnlockAssessmentResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'unlockAssessment',
      dataSourceName: 'AssessmentsDS',
      requestMappingTemplate: lockAssessment('OPEN'),
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });
  }
}
