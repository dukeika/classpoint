import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';

export interface ClasspointCatalogStackProps extends StackProps {
  envName: string;
  apiId: string;
}

export class ClasspointCatalogStack extends Stack {
  constructor(scope: Construct, id: string, props: ClasspointCatalogStackProps) {
    super(scope, id, props);

    const { envName, apiId } = props;
    Tags.of(this).add('environment', envName);

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

    const adminGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN") && !$groups.contains("SCHOOL_ADMIN"))
    $util.unauthorized()
  #end
`;

    const appAdminGuard = tenantGuard + `
  #set($groups = $util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), []))
  #if(!$groups.contains("APP_ADMIN"))
    $util.unauthorized()
  #end
`;

    new appsync.CfnResolver(this, 'ProviderConfigsBySchool', {
      apiId,
      typeName: 'Query',
      fieldName: 'providerConfigsBySchool',
      dataSourceName: 'ProviderConfigsDS',
      requestMappingTemplate: adminGuard + `
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "bySchoolProvider",
  "query": {
    "expression": "schoolId = :sid",
    "expressionValues": {
      ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    new appsync.CfnResolver(this, 'PlansQuery', {
      apiId,
      typeName: 'Query',
      fieldName: 'plans',
      dataSourceName: 'PlansDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "Scan",
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    new appsync.CfnResolver(this, 'AddOnsQuery', {
      apiId,
      typeName: 'Query',
      fieldName: 'addOns',
      dataSourceName: 'AddOnsDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "Scan",
  "limit": $util.defaultIfNull($ctx.args.limit, 100)
}`,
      responseMappingTemplate: '$util.toJson($ctx.result.items)'
    });

    new appsync.CfnResolver(this, 'CreatePlan', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createPlan',
      dataSourceName: 'PlansDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "code": $util.dynamodb.toDynamoDBJson($ctx.args.input.code),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
    "billingCycle": $util.dynamodb.toDynamoDBJson($ctx.args.input.billingCycle),
    "basePrice": $util.dynamodb.toDynamoDBJson($ctx.args.input.basePrice),
    "currency": $util.dynamodb.toDynamoDBJson($ctx.args.input.currency),
    "status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "condition": {
    "expression": "attribute_not_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    new appsync.CfnResolver(this, 'UpdatePlan', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'updatePlan',
      dataSourceName: 'PlansDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #code = :code, #name = :name, #description = :description, #billingCycle = :billingCycle, #basePrice = :basePrice, #currency = :currency, #status = :status, #updatedAt = :updatedAt",
    "expressionNames": {
      "#code": "code",
      "#name": "name",
      "#description": "description",
      "#billingCycle": "billingCycle",
      "#basePrice": "basePrice",
      "#currency": "currency",
      "#status": "status",
      "#updatedAt": "updatedAt"
    },
    "expressionValues": {
      ":code": $util.dynamodb.toDynamoDBJson($ctx.args.input.code),
      ":name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
      ":description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
      ":billingCycle": $util.dynamodb.toDynamoDBJson($ctx.args.input.billingCycle),
      ":basePrice": $util.dynamodb.toDynamoDBJson($ctx.args.input.basePrice),
      ":currency": $util.dynamodb.toDynamoDBJson($ctx.args.input.currency),
      ":status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    new appsync.CfnResolver(this, 'DeletePlan', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'deletePlan',
      dataSourceName: 'PlansDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`,
      responseMappingTemplate: '$util.toJson(true)'
    });

    new appsync.CfnResolver(this, 'CreateAddOn', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createAddOn',
      dataSourceName: 'AddOnsDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "code": $util.dynamodb.toDynamoDBJson($ctx.args.input.code),
    "name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
    "description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
    "pricingModel": $util.dynamodb.toDynamoDBJson($ctx.args.input.pricingModel),
    "price": $util.dynamodb.toDynamoDBJson($ctx.args.input.price),
    "status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "condition": {
    "expression": "attribute_not_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    new appsync.CfnResolver(this, 'UpdateAddOn', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'updateAddOn',
      dataSourceName: 'AddOnsDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #code = :code, #name = :name, #description = :description, #pricingModel = :pricingModel, #price = :price, #status = :status, #updatedAt = :updatedAt",
    "expressionNames": {
      "#code": "code",
      "#name": "name",
      "#description": "description",
      "#pricingModel": "pricingModel",
      "#price": "price",
      "#status": "status",
      "#updatedAt": "updatedAt"
    },
    "expressionValues": {
      ":code": $util.dynamodb.toDynamoDBJson($ctx.args.input.code),
      ":name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
      ":description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
      ":pricingModel": $util.dynamodb.toDynamoDBJson($ctx.args.input.pricingModel),
      ":price": $util.dynamodb.toDynamoDBJson($ctx.args.input.price),
      ":status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    new appsync.CfnResolver(this, 'DeleteAddOn', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'deleteAddOn',
      dataSourceName: 'AddOnsDS',
      requestMappingTemplate: appAdminGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`,
      responseMappingTemplate: '$util.toJson(true)'
    });

    new appsync.CfnResolver(this, 'CreateProviderConfig', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'createProviderConfig',
      dataSourceName: 'ProviderConfigsDS',
      requestMappingTemplate: adminGuard + `
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "providerName": $util.dynamodb.toDynamoDBJson($ctx.args.input.providerName),
    "configJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.configJson),
    "status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
    "updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  },
  "condition": {
    "expression": "attribute_not_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    new appsync.CfnResolver(this, 'UpdateProviderConfig', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'updateProviderConfig',
      dataSourceName: 'ProviderConfigsDS',
      requestMappingTemplate: adminGuard + `
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.input.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #type = :type, #providerName = :providerName, #configJson = :configJson, #status = :status, #updatedAt = :updatedAt",
    "expressionNames": {
      "#type": "type",
      "#providerName": "providerName",
      "#configJson": "configJson",
      "#status": "status",
      "#updatedAt": "updatedAt"
    },
    "expressionValues": {
      ":type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
      ":providerName": $util.dynamodb.toDynamoDBJson($ctx.args.input.providerName),
      ":configJson": $util.dynamodb.toDynamoDBJson($ctx.args.input.configJson),
      ":status": $util.dynamodb.toDynamoDBJson($ctx.args.input.status),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": { "#id": "id" }
  }
}`,
      responseMappingTemplate: '$util.toJson($ctx.result)'
    });

    new appsync.CfnResolver(this, 'DeleteProviderConfig', {
      apiId,
      typeName: 'Mutation',
      fieldName: 'deleteProviderConfig',
      dataSourceName: 'ProviderConfigsDS',
      requestMappingTemplate: adminGuard + `
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "schoolId": $util.dynamodb.toDynamoDBJson($ctx.args.schoolId),
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`,
      responseMappingTemplate: '$util.toJson(true)'
    });
  }
}
