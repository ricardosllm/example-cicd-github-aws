# Example CICD GitHub AWS

This is an example project to create a CICD pipeline between GitHub and AWS.
It aims to examplify a flow where:

1. Commits done on github trigger events
1. AWS CodePipeline responds to those events
1. Runs tests and linters
1. If all tests pass it deploys the application

Other secondary examples on this project include:

1. All infrastructure is defined as code using [AWS cdk](https://aws.amazon.com/cdk/)

# Example App

## Static Site 

This example creates the infrastructure for a static site, which uses an S3 
bucket for storing the content.  The site contents (located in the 
'site-contents' sub-directory) are deployed to the bucket.

The site redirects from HTTP to HTTPS, using a CloudFront distribution, 
Route53 alias record, and ACM certificate.

## Prep

The domain for the static site (i.e. mystaticsite.com) must be configured as a hosted zone in Route53 prior to deploying this example.  For instructions on configuring Route53 as the DNS service for your domain, see the [Route53 documentation](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring.html).

## Setup

```
npm install -g aws-cdk
npm install
```

### Build

```
npm run build
```

### Deploy

```
env AWS_ACCOUNT_ID=<your aws account_id> \
cdk deploy \
-c domain=mystaticsite.com \
-c subdomain=www \
--profile <your_aws_profile>
```

---

This example was created based on [aws-sampes/aws-cdk-examples/typescript/static-site](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/static-site) and [aws/aws-cdk AWS CodePipeline Actions](https://github.com/aws/aws-cdk/tree/master/packages/%40aws-cdk/aws-codepipeline-actions)
