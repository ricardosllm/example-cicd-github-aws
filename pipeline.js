#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const codebuild = require("@aws-cdk/aws-codebuild");
const codepipeline = require("@aws-cdk/aws-codepipeline");
const codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
const core_1 = require("@aws-cdk/core");
class Pipeline extends core_1.Construct {
    constructor(parent, name, props) {
        super(parent, name);
        const sourceOutput = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'ricardosllm',
            repo: 'example-cicd-github-aws',
            oauthToken: cdk.SecretValue.secretsManager(props.sourceToken),
            output: sourceOutput,
            branch: 'master',
            // default: 'WEBHOOK', 'NONE' is also possible for no Source trigger
            trigger: codepipeline_actions.GitHubTrigger.WEBHOOK
        });
        const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                role: props.serviceRole,
                phases: {
                    install: {
                        commands: 'npm install',
                    },
                    build: {
                        commands: [
                            'env',
                            'npm run build',
                            './node_modules/.bin/cdk synth --role-arn ' + props.serviceRole
                        ],
                    },
                },
                artifacts: {
                    'base-directory': 'cdk.out',
                    files: [
                        props.cfnTemplate,
                    ],
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1,
            },
        });
        const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');
        const cdkBuildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'CDK_Build',
            project: cdkBuild,
            input: sourceOutput,
            outputs: [cdkBuildOutput],
        });
        // Not doing anything atm as there's nothing to build from the static site. TODO
        const SiteBuild = new codebuild.PipelineProject(this, 'SiteBuild', {
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                role: props.serviceRole,
                phases: {
                    install: {
                        commands: [
                            'cd site-contents',
                        ],
                    },
                    build: {
                        commands: 'echo "Nothing to do here..."',
                    },
                },
                artifacts: {
                    'base-directory': 'site-contents',
                    files: [
                        'index.html',
                        'error.html',
                    ],
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1,
            },
        });
        const siteBuildOutput = new codepipeline.Artifact('SiteBuildOutput');
        const siteBuildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Site_Build',
            project: SiteBuild,
            input: sourceOutput,
            outputs: [siteBuildOutput],
        });
        const deployAction = new codepipeline_actions.CloudFormationCreateUpdateStackAction({
            actionName: 'Site_CFN_Deploy',
            templatePath: cdkBuildOutput.atPath(props.cfnTemplate),
            stackName: 'SiteDeploymentStack',
            adminPermissions: true,
            extraInputs: [siteBuildOutput],
        });
        new codepipeline.Pipeline(this, 'Pipeline', {
            stages: [
                {
                    stageName: 'Source',
                    actions: [sourceAction],
                },
                {
                    stageName: 'Build',
                    actions: [
                        cdkBuildAction,
                        siteBuildAction
                    ],
                },
                {
                    stageName: 'Deploy',
                    actions: [deployAction],
                },
            ],
        });
    }
}
exports.Pipeline = Pipeline;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsb0RBQXFEO0FBQ3JELDBEQUEyRDtBQUMzRCwwRUFBMkU7QUFDM0Usd0NBQTBDO0FBUzFDLE1BQWEsUUFBUyxTQUFRLGdCQUFTO0lBQ3JDLFlBQVksTUFBaUIsRUFBRSxJQUFZLEVBQUUsS0FBb0I7UUFDL0QsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwQixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDO1lBQy9ELFVBQVUsRUFBRSxlQUFlO1lBQzNCLEtBQUssRUFBRSxhQUFhO1lBQ3BCLElBQUksRUFBRSx5QkFBeUI7WUFDL0IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDN0QsTUFBTSxFQUFFLFlBQVk7WUFDcEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsb0VBQW9FO1lBQ3BFLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUNwRCxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMvRCxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxLQUFLO2dCQUNkLElBQUksRUFBRSxLQUFLLENBQUMsV0FBVztnQkFDdkIsTUFBTSxFQUFFO29CQUNOLE9BQU8sRUFBRTt3QkFDUCxRQUFRLEVBQUUsYUFBYTtxQkFDeEI7b0JBQ0QsS0FBSyxFQUFFO3dCQUNMLFFBQVEsRUFBRTs0QkFDUixLQUFLOzRCQUNMLGVBQWU7NEJBQ2YsMkNBQTJDLEdBQUcsS0FBSyxDQUFDLFdBQVc7eUJBQ2hFO3FCQUNGO2lCQUNGO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxnQkFBZ0IsRUFBRSxTQUFTO29CQUMzQixLQUFLLEVBQUU7d0JBQ0wsS0FBSyxDQUFDLFdBQVc7cUJBQ2xCO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsU0FBUyxDQUFDLGVBQWUsQ0FBQywyQkFBMkI7YUFDbEU7U0FDRixDQUFDLENBQUM7UUFDSCxNQUFNLGNBQWMsR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNuRSxNQUFNLGNBQWMsR0FBRyxJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQztZQUM5RCxVQUFVLEVBQUUsV0FBVztZQUN2QixPQUFPLEVBQUUsUUFBUTtZQUNqQixLQUFLLEVBQUUsWUFBWTtZQUNuQixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsZ0ZBQWdGO1FBQ2hGLE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ2pFLFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztnQkFDeEMsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsSUFBSSxFQUFFLEtBQUssQ0FBQyxXQUFXO2dCQUN2QixNQUFNLEVBQUU7b0JBQ04sT0FBTyxFQUFFO3dCQUNQLFFBQVEsRUFBRTs0QkFDUixrQkFBa0I7eUJBQ25CO3FCQUNGO29CQUNELEtBQUssRUFBRTt3QkFDTCxRQUFRLEVBQUUsOEJBQThCO3FCQUN6QztpQkFDRjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsZ0JBQWdCLEVBQUUsZUFBZTtvQkFDakMsS0FBSyxFQUFFO3dCQUNMLFlBQVk7d0JBQ1osWUFBWTtxQkFDYjtpQkFDRjthQUNGLENBQUM7WUFDRixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsMkJBQTJCO2FBQ2xFO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxlQUFlLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDckUsTUFBTSxlQUFlLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7WUFDL0QsVUFBVSxFQUFFLFlBQVk7WUFDeEIsT0FBTyxFQUFFLFNBQVM7WUFDbEIsS0FBSyxFQUFFLFlBQVk7WUFDbkIsT0FBTyxFQUFFLENBQUMsZUFBZSxDQUFDO1NBQzNCLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksb0JBQW9CLENBQUMscUNBQXFDLENBQUM7WUFDbEYsVUFBVSxFQUFFLGlCQUFpQjtZQUM3QixZQUFZLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQ3RELFNBQVMsRUFBRSxxQkFBcUI7WUFDaEMsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixXQUFXLEVBQUUsQ0FBQyxlQUFlLENBQUM7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDMUMsTUFBTSxFQUFFO2dCQUNOO29CQUNFLFNBQVMsRUFBRSxRQUFRO29CQUNuQixPQUFPLEVBQUUsQ0FBRSxZQUFZLENBQUU7aUJBQzFCO2dCQUNEO29CQUNFLFNBQVMsRUFBRSxPQUFPO29CQUNsQixPQUFPLEVBQUU7d0JBQ1AsY0FBYzt3QkFDZCxlQUFlO3FCQUNoQjtpQkFDRjtnQkFDRDtvQkFDRSxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsT0FBTyxFQUFFLENBQUUsWUFBWSxDQUFFO2lCQUMxQjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbEhELDRCQWtIQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgY29kZWJ1aWxkID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCcpO1xuaW1wb3J0IGNvZGVwaXBlbGluZSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUnKTtcbmltcG9ydCBjb2RlcGlwZWxpbmVfYWN0aW9ucyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucycpO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG4vLyBpbXBvcnQgeyBBcHAsIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZWxpbmVQcm9wcyB7XG4gIHNvdXJjZVRva2VuOiBzdHJpbmc7XG4gIGNmblRlbXBsYXRlOiBzdHJpbmc7XG4gIHNlcnZpY2VSb2xlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlbGluZSBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudDogQ29uc3RydWN0LCBuYW1lOiBzdHJpbmcsIHByb3BzOiBQaXBlbGluZVByb3BzKSB7XG4gICAgc3VwZXIocGFyZW50LCBuYW1lKTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBzb3VyY2VBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWJfU291cmNlJyxcbiAgICAgIG93bmVyOiAncmljYXJkb3NsbG0nLFxuICAgICAgcmVwbzogJ2V4YW1wbGUtY2ljZC1naXRodWItYXdzJyxcbiAgICAgIG9hdXRoVG9rZW46IGNkay5TZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcihwcm9wcy5zb3VyY2VUb2tlbiksXG4gICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgIGJyYW5jaDogJ21hc3RlcicsXG4gICAgICAvLyBkZWZhdWx0OiAnV0VCSE9PSycsICdOT05FJyBpcyBhbHNvIHBvc3NpYmxlIGZvciBubyBTb3VyY2UgdHJpZ2dlclxuICAgICAgdHJpZ2dlcjogY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViVHJpZ2dlci5XRUJIT09LXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZGtCdWlsZCA9IG5ldyBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdDZGtCdWlsZCcsIHtcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgIHJvbGU6IHByb3BzLnNlcnZpY2VSb2xlLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICBjb21tYW5kczogJ25wbSBpbnN0YWxsJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnZW52JywgLy8gVE9ETzogcmVtb3ZlIGFmdGVyIGRlYnVnZ2luZ1xuICAgICAgICAgICAgICAnbnBtIHJ1biBidWlsZCcsXG4gICAgICAgICAgICAgICcuL25vZGVfbW9kdWxlcy8uYmluL2NkayBzeW50aCAtLXJvbGUtYXJuICcgKyBwcm9wcy5zZXJ2aWNlUm9sZVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnY2RrLm91dCcsXG4gICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgIHByb3BzLmNmblRlbXBsYXRlLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuVUJVTlRVXzE0XzA0X05PREVKU18xMF8xNF8xLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBjZGtCdWlsZE91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ0Nka0J1aWxkT3V0cHV0Jyk7XG4gICAgY29uc3QgY2RrQnVpbGRBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdDREtfQnVpbGQnLFxuICAgICAgcHJvamVjdDogY2RrQnVpbGQsXG4gICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgb3V0cHV0czogW2Nka0J1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIC8vIE5vdCBkb2luZyBhbnl0aGluZyBhdG0gYXMgdGhlcmUncyBub3RoaW5nIHRvIGJ1aWxkIGZyb20gdGhlIHN0YXRpYyBzaXRlLiBUT0RPXG4gICAgY29uc3QgU2l0ZUJ1aWxkID0gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgJ1NpdGVCdWlsZCcsIHtcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgIHJvbGU6IHByb3BzLnNlcnZpY2VSb2xlLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnY2Qgc2l0ZS1jb250ZW50cycsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiAnZWNobyBcIk5vdGhpbmcgdG8gZG8gaGVyZS4uLlwiJywgLy8gVE9ETzogZXhhbXBsaWZ5IHNpdGUgYnVpbGRpbmdcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnc2l0ZS1jb250ZW50cycsXG4gICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgICdpbmRleC5odG1sJyxcbiAgICAgICAgICAgICdlcnJvci5odG1sJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBidWlsZEltYWdlOiBjb2RlYnVpbGQuTGludXhCdWlsZEltYWdlLlVCVU5UVV8xNF8wNF9OT0RFSlNfMTBfMTRfMSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3Qgc2l0ZUJ1aWxkT3V0cHV0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgnU2l0ZUJ1aWxkT3V0cHV0Jyk7XG4gICAgY29uc3Qgc2l0ZUJ1aWxkQWN0aW9uID0gbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNvZGVCdWlsZEFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnU2l0ZV9CdWlsZCcsXG4gICAgICBwcm9qZWN0OiBTaXRlQnVpbGQsXG4gICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgb3V0cHV0czogW3NpdGVCdWlsZE91dHB1dF0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBkZXBsb3lBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ2xvdWRGb3JtYXRpb25DcmVhdGVVcGRhdGVTdGFja0FjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnU2l0ZV9DRk5fRGVwbG95JyxcbiAgICAgIHRlbXBsYXRlUGF0aDogY2RrQnVpbGRPdXRwdXQuYXRQYXRoKHByb3BzLmNmblRlbXBsYXRlKSxcbiAgICAgIHN0YWNrTmFtZTogJ1NpdGVEZXBsb3ltZW50U3RhY2snLFxuICAgICAgYWRtaW5QZXJtaXNzaW9uczogdHJ1ZSxcbiAgICAgIGV4dHJhSW5wdXRzOiBbc2l0ZUJ1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIG5ldyBjb2RlcGlwZWxpbmUuUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgc3RhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgICAgIGFjdGlvbnM6IFsgc291cmNlQWN0aW9uIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgY2RrQnVpbGRBY3Rpb24sXG4gICAgICAgICAgICBzaXRlQnVpbGRBY3Rpb25cbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhZ2VOYW1lOiAnRGVwbG95JyxcbiAgICAgICAgICBhY3Rpb25zOiBbIGRlcGxveUFjdGlvbiBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxufVxuXG4iXX0=