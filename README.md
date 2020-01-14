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

### Install Depenedencies

```
npm install
```

### Create GitHub token

Follow the instructions [here](https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-authentication.html) and make sure to use the `CLI` instructions
as you need a `personal access token` to authenticate with `cdk`

### Upload your github token to SSM

Once you have your token you have to upload it to ssm (preferably in the
same region as the stack). 

> Make sure to use the `plaintext` option and NOT the key value pair.

### Create AWS Service Role

You need to create a service role that both `cloudformation` and `codebuild` 
can use in the pipeline's build and deploy actions

In the IAM console create a service role, make sure to add only the required
IAM permissions and to add trust relantionsships to both `cloudformation` 
and `codebuild`. 

Here's an example for the trust relationship policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudformation.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

> Once you have the value above edit [index.ts](./index.ts) with the required values

### [optional] Context

Edit [cdk.json](./cdk.json) with your `domain` and `subdomain`

## Build

```
npm run build
```

## Deploy the Pipeline

```
./node_modules/.bin/cdk deploy --profile <your_aws_profile>
```

> The static site is deployed automatically after a git commit 
> Make sure you trigger the pipeline after the deployment


## Test the Pipeline

Edit [site-contents/index.html](./site-contents/index.html) and commit the changes
Then go to your subdomain.domain and see the changes deployed. 

> you can see the progress of the pipeline in the AWS Code Pipeline console

---

This example was created based on [aws-sampes/aws-cdk-examples/typescript/static-site](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/static-site) and [aws/aws-cdk AWS CodePipeline Actions](https://github.com/aws/aws-cdk/tree/master/packages/%40aws-cdk/aws-codepipeline-actions)
