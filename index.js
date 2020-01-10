#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const static_site_1 = require("./static-site");
const pipeline_1 = require("./pipeline");
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
    constructor(parent, name, props) {
        super(parent, name, props);
        new static_site_1.StaticSite(this, 'StaticSite', {
            domainName: this.node.tryGetContext('domain'),
            siteSubDomain: this.node.tryGetContext('subdomain'),
        });
    }
}
class PipelineStack extends cdk.Stack {
    constructor(parent, name, props) {
        super(parent, name, props);
        new pipeline_1.Pipeline(this, 'Pipeline', {
            sourceToken: 'github-token-ricardosllm',
            cfnTemplate: 'MyStaticSite.template.json',
            serviceRole: 'arn:aws:iam::191560372108:role/ServiceRoleCloudFormationAdminAccess'
        });
    }
}
new MyStaticSiteStack(app, 'MyStaticSite', {
    env: { region: 'us-east-1', account: '191560372108' }
});
new PipelineStack(app, 'PipelineMyStaticSite', {
    env: { region: 'us-east-1', account: '191560372108' }
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsK0NBQTJDO0FBQzNDLHlDQUFzQztBQUV0QyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQjs7Ozs7Ozs7Ozs7SUFXSTtBQUNKLE1BQU0saUJBQWtCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDdkMsWUFBWSxNQUFlLEVBQUUsSUFBWSxFQUFFLEtBQXFCO1FBQzlELEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTNCLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2pDLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7WUFDN0MsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztTQUNwRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNuQyxZQUFZLE1BQWUsRUFBRSxJQUFZLEVBQUUsS0FBcUI7UUFDOUQsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFM0IsSUFBSSxtQkFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDN0IsV0FBVyxFQUFFLDBCQUEwQjtZQUN2QyxXQUFXLEVBQUUsNEJBQTRCO1lBQ3pDLFdBQVcsRUFBRSxxRUFBcUU7U0FDbkYsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsY0FBYyxFQUFFO0lBQ3pDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRTtDQUV0RCxDQUFDLENBQUM7QUFFSCxJQUFJLGFBQWEsQ0FBQyxHQUFHLEVBQUUsc0JBQXNCLEVBQUU7SUFDN0MsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFO0NBQ3RELENBQUMsQ0FBQTtBQUVGLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgeyBTdGF0aWNTaXRlIH0gZnJvbSAnLi9zdGF0aWMtc2l0ZSc7XG5pbXBvcnQgeyBQaXBlbGluZSB9IGZyb20gJy4vcGlwZWxpbmUnO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG4vKipcbiAqIFRoaXMgc3RhY2sgcmVsaWVzIG9uIGdldHRpbmcgdGhlIGRvbWFpbiBuYW1lIGZyb20gQ0RLIGNvbnRleHQuXG4gKiBVc2UgJ2NkayBzeW50aCAtYyBkb21haW49bXlzdGF0aWNzaXRlLmNvbSAtYyBzdWJkb21haW49d3d3IC1jIGFjY291bnQ9YWNjb3VudF9pZCdcbiAqIE9yIGFkZCB0aGUgZm9sbG93aW5nIHRvIGNkay5qc29uOlxuICoge1xuICogICBcImNvbnRleHRcIjoge1xuICogICAgIFwiZG9tYWluXCI6IFwibXlzdGF0aWNzaXRlLmNvbVwiLFxuICogICAgIFwic3ViZG9tYWluXCI6IFwid3d3XCIsXG4gKiAgICAgXCJhY2NvdW50XCI6IFwiYXdzX2FjY291bnRfaWRcIlxuICogICB9XG4gKiB9XG4gKiovXG5jbGFzcyBNeVN0YXRpY1NpdGVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudDogY2RrLkFwcCwgbmFtZTogc3RyaW5nLCBwcm9wczogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihwYXJlbnQsIG5hbWUsIHByb3BzKTtcblxuICAgIG5ldyBTdGF0aWNTaXRlKHRoaXMsICdTdGF0aWNTaXRlJywge1xuICAgICAgZG9tYWluTmFtZTogdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2RvbWFpbicpLFxuICAgICAgc2l0ZVN1YkRvbWFpbjogdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3N1YmRvbWFpbicpLFxuICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIFBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihwYXJlbnQ6IGNkay5BcHAsIG5hbWU6IHN0cmluZywgcHJvcHM6IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIocGFyZW50LCBuYW1lLCBwcm9wcyk7XG5cbiAgICBuZXcgUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgc291cmNlVG9rZW46ICdnaXRodWItdG9rZW4tcmljYXJkb3NsbG0nLFxuICAgICAgY2ZuVGVtcGxhdGU6ICdNeVN0YXRpY1NpdGUudGVtcGxhdGUuanNvbicsXG4gICAgICBzZXJ2aWNlUm9sZTogJ2Fybjphd3M6aWFtOjoxOTE1NjAzNzIxMDg6cm9sZS9TZXJ2aWNlUm9sZUNsb3VkRm9ybWF0aW9uQWRtaW5BY2Nlc3MnXG4gICAgfSk7XG4gIH1cbn1cblxubmV3IE15U3RhdGljU2l0ZVN0YWNrKGFwcCwgJ015U3RhdGljU2l0ZScsIHtcbiAgZW52OiB7IHJlZ2lvbjogJ3VzLWVhc3QtMScsIGFjY291bnQ6ICcxOTE1NjAzNzIxMDgnIH1cblxufSk7XG5cbm5ldyBQaXBlbGluZVN0YWNrKGFwcCwgJ1BpcGVsaW5lTXlTdGF0aWNTaXRlJywge1xuICBlbnY6IHsgcmVnaW9uOiAndXMtZWFzdC0xJywgYWNjb3VudDogJzE5MTU2MDM3MjEwOCcgfVxufSlcblxuYXBwLnN5bnRoKCk7XG4iXX0=