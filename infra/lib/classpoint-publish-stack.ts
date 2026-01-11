import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';

export interface ClasspointPublishStackProps extends StackProps {
  envName: string;
  apiId: string;
}

export class ClasspointPublishStack extends Stack {
  constructor(scope: Construct, id: string, props: ClasspointPublishStackProps) {
    super(scope, id, props);

    const { envName, apiId } = props;
    Tags.of(this).add('environment', envName);

    const appsyncFunctionNamePrefix = `classpoint_${envName}`.replace(/[^A-Za-z0-9_]/g, '_');

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
    const staffGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN") && !$groups.contains("SCHOOL_ADMIN") && !$groups.contains("BURSAR") && !$groups.contains("TEACHER"))
    $util.unauthorized()
  #end
`;
    const resultsGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN") && !$groups.contains("SCHOOL_ADMIN") && !$groups.contains("TEACHER"))
    $util.unauthorized()
  #end
`;

    const updateAnnouncementFn = new appsync.CfnFunctionConfiguration(this, 'UpdateAnnouncementFn', {
      apiId,
      name: `${appsyncFunctionNamePrefix}_updateAnnouncement`,
      dataSourceName: 'AnnouncementsDS',
      functionVersion: '2018-05-29',
      requestMappingTemplate: staffGuard + `{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.announcementId)
  },
  "update": {
    "expression": "SET publishedAt = if_not_exists(publishedAt, :now)",
    "expressionValues": { ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()) }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const publishAnnouncementEventFn = new appsync.CfnFunctionConfiguration(this, 'PublishAnnouncementEventFn', {
      apiId,
      name: `${appsyncFunctionNamePrefix}_publishAnnouncementEvent`,
      dataSourceName: 'EventPublisherDS',
      functionVersion: '2018-05-29',
      requestMappingTemplate: staffGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": "announcement.published",
    "source": "classpoint.cms",
    "detail": {
      "schoolId": $util.toJson($ctx.args.schoolId),
      "announcementId": $util.toJson($ctx.args.announcementId),
      "audience": $util.toJson($ctx.args.audience),
      "classGroupId": $util.toJson($ctx.args.classGroupId),
      "termId": $util.toJson($ctx.args.termId)
    }
  }
}`,
      responseMappingTemplate: '$util.toJson(true)'
    });

    new appsync.CfnResolver(this, 'PublishAnnouncementResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'publishAnnouncement',
      kind: 'PIPELINE',
      pipelineConfig: {
        functions: [updateAnnouncementFn.attrFunctionId, publishAnnouncementEventFn.attrFunctionId]
      },
      requestMappingTemplate: staffGuard + '{}',
      responseMappingTemplate: '$util.toJson(true)'
    });

    const updateReportCardFn = new appsync.CfnFunctionConfiguration(this, 'UpdateReportCardFn', {
      apiId,
      name: `${appsyncFunctionNamePrefix}_updateReportCard`,
      dataSourceName: 'ReportCardsDS',
      functionVersion: '2018-05-29',
      requestMappingTemplate: resultsGuard + `
#set($targetId = $util.defaultIfNull($ctx.args.reportCardId, $ctx.args.studentId))
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($targetId)
  },
  "update": {
    "expression": "SET #status = :status, publishedAt = if_not_exists(publishedAt, :now)",
    "expressionNames": { "#status": "status" },
    "expressionValues": {
      ":status": $util.dynamodb.toDynamoDBJson("PUBLISHED"),
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    const publishResultEventFn = new appsync.CfnFunctionConfiguration(this, 'PublishResultEventFn', {
      apiId,
      name: `${appsyncFunctionNamePrefix}_publishResultEvent`,
      dataSourceName: 'EventPublisherDS',
      functionVersion: '2018-05-29',
      requestMappingTemplate: resultsGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": "result.ready",
    "source": "classpoint.academics",
    "detail": {
      "schoolId": $util.toJson($ctx.args.schoolId),
      "studentId": $util.toJson($ctx.args.studentId),
      "classGroupId": $util.toJson($ctx.args.classGroupId),
      "termId": $util.toJson($ctx.args.termId)
    }
  }
}`,
      responseMappingTemplate: '$util.toJson(true)'
    });

    new appsync.CfnResolver(this, 'PublishResultReadyResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'publishResultReady',
      kind: 'PIPELINE',
      pipelineConfig: {
        functions: [updateReportCardFn.attrFunctionId, publishResultEventFn.attrFunctionId]
      },
      requestMappingTemplate: resultsGuard + '{}',
      responseMappingTemplate: '$util.toJson(true)'
    });

    new appsync.CfnResolver(this, 'EmitAnnouncementNotificationResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'emitAnnouncementNotification',
      dataSourceName: 'EventPublisherDS',
      requestMappingTemplate: tenantGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": "announcement.published",
    "source": "classpoint.cms",
    "detail": {
      "schoolId": $util.toJson($ctx.args.schoolId),
      "announcementId": $util.toJson($ctx.args.announcementId)
    }
  }
}`,
      responseMappingTemplate: '$util.toJson(true)'
    });

    new appsync.CfnResolver(this, 'EmitResultReadyNotificationResolver', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'emitResultReadyNotification',
      dataSourceName: 'EventPublisherDS',
      requestMappingTemplate: resultsGuard + `{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "detailType": "result.ready",
    "source": "classpoint.academics",
    "detail": {
      "schoolId": $util.toJson($ctx.args.schoolId),
      "studentId": $util.toJson($ctx.args.studentId),
      "classGroupId": $util.toJson($ctx.args.classGroupId),
      "termId": $util.toJson($ctx.args.termId)
    }
  }
}`,
      responseMappingTemplate: '$util.toJson(true)'
    });
  }
}
