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
            cfnTemplate: 'MyStaticSite.template.json'
        });
    }
}
new MyStaticSiteStack(app, 'MyStaticSite', { env: {
        // Stack must be in us-east-1, because the ACM certificate for a
        // global CloudFront distribution must be requested in us-east-1.
        region: 'us-east-1',
        account: process.env.AWS_ACCOUNT_ID
    } });
new PipelineStack(app, 'PipelineMyStaticSite', { env: {
        region: 'us-east-1',
    } });
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsK0NBQTJDO0FBQzNDLHlDQUFzQztBQUV0QyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQjs7Ozs7Ozs7Ozs7SUFXSTtBQUNKLE1BQU0saUJBQWtCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDdkMsWUFBWSxNQUFlLEVBQUUsSUFBWSxFQUFFLEtBQXFCO1FBQzlELEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTNCLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2pDLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7WUFDN0MsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztTQUNwRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNuQyxZQUFZLE1BQWUsRUFBRSxJQUFZLEVBQUUsS0FBcUI7UUFDOUQsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFM0IsSUFBSSxtQkFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDN0IsV0FBVyxFQUFFLDBCQUEwQjtZQUN2QyxXQUFXLEVBQUUsNEJBQTRCO1NBQzFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELElBQUksaUJBQWlCLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxFQUFFLEdBQUcsRUFBRTtRQUNoRCxnRUFBZ0U7UUFDaEUsaUVBQWlFO1FBQ2pFLE1BQU0sRUFBRSxXQUFXO1FBQ25CLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7S0FDcEMsRUFBQyxDQUFDLENBQUM7QUFFSixJQUFJLGFBQWEsQ0FBQyxHQUFHLEVBQUUsc0JBQXNCLEVBQUUsRUFBRSxHQUFHLEVBQUU7UUFDcEQsTUFBTSxFQUFFLFdBQVc7S0FDcEIsRUFBQyxDQUFDLENBQUE7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgY2RrID0gcmVxdWlyZSgnQGF3cy1jZGsvY29yZScpO1xuaW1wb3J0IHsgU3RhdGljU2l0ZSB9IGZyb20gJy4vc3RhdGljLXNpdGUnO1xuaW1wb3J0IHsgUGlwZWxpbmUgfSBmcm9tICcuL3BpcGVsaW5lJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLyoqXG4gKiBUaGlzIHN0YWNrIHJlbGllcyBvbiBnZXR0aW5nIHRoZSBkb21haW4gbmFtZSBmcm9tIENESyBjb250ZXh0LlxuICogVXNlICdjZGsgc3ludGggLWMgZG9tYWluPW15c3RhdGljc2l0ZS5jb20gLWMgc3ViZG9tYWluPXd3dyAtYyBhY2NvdW50PWFjY291bnRfaWQnXG4gKiBPciBhZGQgdGhlIGZvbGxvd2luZyB0byBjZGsuanNvbjpcbiAqIHtcbiAqICAgXCJjb250ZXh0XCI6IHtcbiAqICAgICBcImRvbWFpblwiOiBcIm15c3RhdGljc2l0ZS5jb21cIixcbiAqICAgICBcInN1YmRvbWFpblwiOiBcInd3d1wiLFxuICogICAgIFwiYWNjb3VudFwiOiBcImF3c19hY2NvdW50X2lkXCJcbiAqICAgfVxuICogfVxuICoqL1xuY2xhc3MgTXlTdGF0aWNTaXRlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihwYXJlbnQ6IGNkay5BcHAsIG5hbWU6IHN0cmluZywgcHJvcHM6IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIocGFyZW50LCBuYW1lLCBwcm9wcyk7XG5cbiAgICBuZXcgU3RhdGljU2l0ZSh0aGlzLCAnU3RhdGljU2l0ZScsIHtcbiAgICAgIGRvbWFpbk5hbWU6IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdkb21haW4nKSxcbiAgICAgIHNpdGVTdWJEb21haW46IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdzdWJkb21haW4nKSxcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBQaXBlbGluZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3IocGFyZW50OiBjZGsuQXBwLCBuYW1lOiBzdHJpbmcsIHByb3BzOiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHBhcmVudCwgbmFtZSwgcHJvcHMpO1xuXG4gICAgbmV3IFBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIHNvdXJjZVRva2VuOiAnZ2l0aHViLXRva2VuLXJpY2FyZG9zbGxtJyxcbiAgICAgIGNmblRlbXBsYXRlOiAnTXlTdGF0aWNTaXRlLnRlbXBsYXRlLmpzb24nXG4gICAgfSk7XG4gIH1cbn1cblxubmV3IE15U3RhdGljU2l0ZVN0YWNrKGFwcCwgJ015U3RhdGljU2l0ZScsIHsgZW52OiB7XG4gIC8vIFN0YWNrIG11c3QgYmUgaW4gdXMtZWFzdC0xLCBiZWNhdXNlIHRoZSBBQ00gY2VydGlmaWNhdGUgZm9yIGFcbiAgLy8gZ2xvYmFsIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uIG11c3QgYmUgcmVxdWVzdGVkIGluIHVzLWVhc3QtMS5cbiAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQVdTX0FDQ09VTlRfSURcbn19KTtcblxubmV3IFBpcGVsaW5lU3RhY2soYXBwLCAnUGlwZWxpbmVNeVN0YXRpY1NpdGUnLCB7IGVudjoge1xuICByZWdpb246ICd1cy1lYXN0LTEnLFxufX0pXG5cbmFwcC5zeW50aCgpO1xuIl19