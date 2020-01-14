#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const codebuild = require("@aws-cdk/aws-codebuild");
const codepipeline = require("@aws-cdk/aws-codepipeline");
const codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
const iam = require("@aws-cdk/aws-iam");
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
        const cdkRole = iam.Role.fromRoleArn(this, 'cdkRole', props.serviceRole);
        const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
            role: cdkRole,
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        commands: 'npm install',
                    },
                    build: {
                        commands: [
                            'npm run build',
                            './node_modules/.bin/cdk synth -o dist',
                            './node_modules/.bin/cdk deploy MyStaticSite --require-approval never',
                            './node_modules/.bin/cdk deploy PipelineMyStaticSite --require-approval never'
                        ],
                    },
                },
                artifacts: {
                    // 'base-directory': 'cdk.out',
                    'base-directory': 'dist',
                    files: [
                        // '*'
                        // props.cfnTemplate,
                        'MyStaticSite.template.json',
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
            templatePath: cdkBuildOutput.atPath('MyStaticSite.template.json'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsb0RBQXFEO0FBQ3JELDBEQUEyRDtBQUMzRCwwRUFBMkU7QUFDM0Usd0NBQXlDO0FBQ3pDLHdDQUEwQztBQVMxQyxNQUFhLFFBQVMsU0FBUSxnQkFBUztJQUNyQyxZQUFZLE1BQWlCLEVBQUUsSUFBWSxFQUFFLEtBQW9CO1FBQy9ELEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFcEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQztZQUMvRCxVQUFVLEVBQUUsZUFBZTtZQUMzQixLQUFLLEVBQUUsYUFBYTtZQUNwQixJQUFJLEVBQUUseUJBQXlCO1lBQy9CLFVBQVUsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQzdELE1BQU0sRUFBRSxZQUFZO1lBQ3BCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLG9FQUFvRTtZQUNwRSxPQUFPLEVBQUUsb0JBQW9CLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDcEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFekUsTUFBTSxRQUFRLEdBQUcsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDL0QsSUFBSSxFQUFFLE9BQU87WUFDYixTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE1BQU0sRUFBRTtvQkFD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WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgY2RrID0gcmVxdWlyZSgnQGF3cy1jZGsvY29yZScpO1xuaW1wb3J0IGNvZGVidWlsZCA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlYnVpbGQnKTtcbmltcG9ydCBjb2RlcGlwZWxpbmUgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lJyk7XG5pbXBvcnQgY29kZXBpcGVsaW5lX2FjdGlvbnMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnKTtcbmltcG9ydCBpYW0gPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtaWFtJyk7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbi8vIGltcG9ydCB7IEFwcCwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcblxuZXhwb3J0IGludGVyZmFjZSBQaXBlbGluZVByb3BzIHtcbiAgc291cmNlVG9rZW46IHN0cmluZztcbiAgY2ZuVGVtcGxhdGU6IHN0cmluZztcbiAgc2VydmljZVJvbGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFBpcGVsaW5lIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgY29uc3RydWN0b3IocGFyZW50OiBDb25zdHJ1Y3QsIG5hbWU6IHN0cmluZywgcHJvcHM6IFBpcGVsaW5lUHJvcHMpIHtcbiAgICBzdXBlcihwYXJlbnQsIG5hbWUpO1xuXG4gICAgY29uc3Qgc291cmNlT3V0cHV0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgpO1xuICAgIGNvbnN0IHNvdXJjZUFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5HaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ0dpdEh1Yl9Tb3VyY2UnLFxuICAgICAgb3duZXI6ICdyaWNhcmRvc2xsbScsXG4gICAgICByZXBvOiAnZXhhbXBsZS1jaWNkLWdpdGh1Yi1hd3MnLFxuICAgICAgb2F1dGhUb2tlbjogY2RrLlNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKHByb3BzLnNvdXJjZVRva2VuKSxcbiAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgICAgYnJhbmNoOiAnbWFzdGVyJyxcbiAgICAgIC8vIGRlZmF1bHQ6ICdXRUJIT09LJywgJ05PTkUnIGlzIGFsc28gcG9zc2libGUgZm9yIG5vIFNvdXJjZSB0cmlnZ2VyXG4gICAgICB0cmlnZ2VyOiBjb2RlcGlwZWxpbmVfYWN0aW9ucy5HaXRIdWJUcmlnZ2VyLldFQkhPT0tcbiAgICB9KTtcblxuICAgIGNvbnN0IGNka1JvbGUgPSBpYW0uUm9sZS5mcm9tUm9sZUFybih0aGlzLCAnY2RrUm9sZScsIHByb3BzLnNlcnZpY2VSb2xlKTtcblxuICAgIGNvbnN0IGNka0J1aWxkID0gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgJ0Nka0J1aWxkJywge1xuICAgICAgcm9sZTogY2RrUm9sZSxcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgIHBoYXNlczoge1xuICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiAnbnBtIGluc3RhbGwnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICducG0gcnVuIGJ1aWxkJyxcbiAgICAgICAgICAgICAgJy4vbm9kZV9tb2R1bGVzLy5iaW4vY2RrIHN5bnRoIC1vIGRpc3QnLFxuICAgICAgICAgICAgICAnLi9ub2RlX21vZHVsZXMvLmJpbi9jZGsgZGVwbG95IE15U3RhdGljU2l0ZSAtLXJlcXVpcmUtYXBwcm92YWwgbmV2ZXInLFxuICAgICAgICAgICAgICAnLi9ub2RlX21vZHVsZXMvLmJpbi9jZGsgZGVwbG95IFBpcGVsaW5lTXlTdGF0aWNTaXRlIC0tcmVxdWlyZS1hcHByb3ZhbCBuZXZlcidcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgLy8gJ2Jhc2UtZGlyZWN0b3J5JzogJ2Nkay5vdXQnLFxuICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdkaXN0JyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgLy8gJyonXG4gICAgICAgICAgICAvLyBwcm9wcy5jZm5UZW1wbGF0ZSxcbiAgICAgICAgICAgICdNeVN0YXRpY1NpdGUudGVtcGxhdGUuanNvbicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5VQlVOVFVfMTRfMDRfTk9ERUpTXzEwXzE0XzEsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IGNka0J1aWxkT3V0cHV0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgnQ2RrQnVpbGRPdXRwdXQnKTtcbiAgICBjb25zdCBjZGtCdWlsZEFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ0NES19CdWlsZCcsXG4gICAgICBwcm9qZWN0OiBjZGtCdWlsZCxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbY2RrQnVpbGRPdXRwdXRdLFxuICAgIH0pO1xuXG4gICAgLy8gTm90IGRvaW5nIGFueXRoaW5nIGF0bSBhcyB0aGVyZSdzIG5vdGhpbmcgdG8gYnVpbGQgZnJvbSB0aGUgc3RhdGljIHNpdGUuIFRPRE9cbiAgICBjb25zdCBTaXRlQnVpbGQgPSBuZXcgY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCh0aGlzLCAnU2l0ZUJ1aWxkJywge1xuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2NkIHNpdGUtY29udGVudHMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczogJ2VjaG8gXCJOb3RoaW5nIHRvIGRvIGhlcmUuLi5cIicsIC8vIFRPRE86IGV4YW1wbGlmeSBzaXRlIGJ1aWxkaW5nXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ3NpdGUtY29udGVudHMnLFxuICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAnaW5kZXguaHRtbCcsXG4gICAgICAgICAgICAnZXJyb3IuaHRtbCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5VQlVOVFVfMTRfMDRfTk9ERUpTXzEwXzE0XzEsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IHNpdGVCdWlsZE91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ1NpdGVCdWlsZE91dHB1dCcpO1xuICAgIGNvbnN0IHNpdGVCdWlsZEFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ1NpdGVfQnVpbGQnLFxuICAgICAgcHJvamVjdDogU2l0ZUJ1aWxkLFxuICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgIG91dHB1dHM6IFtzaXRlQnVpbGRPdXRwdXRdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGVwbG95QWN0aW9uID0gbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ1NpdGVfQ0ZOX0RlcGxveScsXG4gICAgICB0ZW1wbGF0ZVBhdGg6IGNka0J1aWxkT3V0cHV0LmF0UGF0aCgnTXlTdGF0aWNTaXRlLnRlbXBsYXRlLmpzb24nKSxcbiAgICAgIHN0YWNrTmFtZTogJ1NpdGVEZXBsb3ltZW50U3RhY2snLFxuICAgICAgYWRtaW5QZXJtaXNzaW9uczogdHJ1ZSxcbiAgICAgIGV4dHJhSW5wdXRzOiBbc2l0ZUJ1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIG5ldyBjb2RlcGlwZWxpbmUuUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgc3RhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgICAgIGFjdGlvbnM6IFsgc291cmNlQWN0aW9uIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgY2RrQnVpbGRBY3Rpb24sXG4gICAgICAgICAgICBzaXRlQnVpbGRBY3Rpb25cbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhZ2VOYW1lOiAnRGVwbG95JyxcbiAgICAgICAgICBhY3Rpb25zOiBbIGRlcGxveUFjdGlvbiBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxufVxuXG4iXX0=