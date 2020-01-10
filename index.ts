#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { StaticSite } from './static-site';
import { Pipeline } from './pipeline';

const app = new cdk.App();

/**
 * This stack relies on getting the domain name from CDK context.
 * Use 'cdk synth -c domain=mystaticsite.com -c subdomain=www -c account=account_id'
 * Or add the following to cdk.json:
 * {
 *   "context": {
 *     "domain": "mystaticsite.com",
 *     "subdomain": "www",
 *     "account": "aws_account_id"
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
      sourceToken: 'github-token-ricardosllm',
      cfnTemplate: 'MyStaticSite.template.json'
    });
  }
}

new MyStaticSiteStack(app, 'MyStaticSite', { env: {
  // Stack must be in us-east-1, because the ACM certificate for a
  // global CloudFront distribution must be requested in us-east-1.
  region: 'us-east-1',
  account: process.env.AWS_ACCOUNT_ID
}});

new PipelineStack(app, 'PipelineMyStaticSite', { env: {
  region: 'us-east-1',
}})

app.synth();
