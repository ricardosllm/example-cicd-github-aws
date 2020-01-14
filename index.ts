#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { StaticSite } from './static-site';
import { Pipeline } from './pipeline';

// Configuration
const appName = 'MyStaticSite'
//   aws
const awsAccount = '';
const awsRegion = 'us-east-1'
const awsServiceRoleName = 'ServiceRoleCloudFormationAdminAccess'
//   github token
const sourceToken = 'github-token-xxxxx'

const app = new cdk.App();

/**
 * This stack relies on getting the domain name from CDK context.
 * Use 'cdk synth -c domain=mystaticsite.com -c subdomain=www'
 * Or add the following to cdk.json:
 * {
 *   "context": {
 *     "domain": "mystaticsite.com",
 *     "subdomain": "www",
 *     "account": "awsAccount_id"
 *   }
 * }
 **/
class MyStaticSiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);

    new StaticSite(this, 'StaticSite', {
      domainName: this.node.tryGetContext('domain'),
      siteSubDomain: this.node.tryGetContext('subdomain'),
    });
  }
}

class PipelineStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);

    new Pipeline(this, 'Pipeline', {
      sourceToken,
      cfnTemplate: appName + '.template.json',
      serviceRole: 'arn:aws:iam::' + awsAccount + ':role/' + awsServiceRoleName
    });
  }
}

new MyStaticSiteStack(app, appName, {
  env: { region: awsRegion, account: awsAccount }

});

new PipelineStack(app, 'PipelineMyStaticSite', {
  env: { region: awsRegion, account: awsAccount }
})

app.synth();
