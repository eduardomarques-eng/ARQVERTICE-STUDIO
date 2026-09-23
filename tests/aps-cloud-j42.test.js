const assert = require('assert');
const APSCloudBIM = require('../js/aps-cloud-bim.js');

(async () => {
    const aps = new APSCloudBIM();
    assert.strictEqual(aps.routeTask('BATCH_EXTRACTION', false).path, APSCloudBIM.EXECUTION_PATHS.CLOUD_AUTOMATION);

    const job = aps.submitRevitCloudJob('PRJ-42', { urn: 'urn:adsk.objects:os.object:bucket/model.rvt' }, {
        engine: 'Revit_2026.5',
        appBundle: 'ArqVerticeBatchExtractor',
        workflow: 'batch_extraction'
    });
    assert.ok(job.jobId.startsWith('cloudjob_'));
    assert.strictEqual(job.status, 'QUEUED');
    assert.deepStrictEqual(job.progress, { stage: 'upload', percent: 0 });

    const running = aps.updateCloudJob(job.jobId, { status: 'RUNNING', progress: { stage: 'processing', percent: 45 } });
    assert.strictEqual(running.status, 'RUNNING');
    assert.strictEqual(running.progress.percent, 45);

    assert.throws(
        () => aps.submitRevitCloudJob('PRJ-42', { clientSecret: 'must-not-enter' }, { appBundle: 'Bad' }),
        /Segredo detectado/
    );

    assert.strictEqual(aps.validateAppBundle({ engine: 'Revit_2026.5', runtime: '.NET 10', appBundle: 'ArqVerticeBatchExtractor' }).valid, true);
    assert.strictEqual(aps.validateAppBundle({ engine: 'Revit_2026', runtime: '.NET 8', appBundle: 'ArqVerticeBatchExtractor' }).valid, false);
    assert.strictEqual(aps.getLocalDebugConfiguration(job.jobId).mode, 'LOCAL_DEBUG');

    const cancelled = aps.cancelCloudJob(job.jobId);
    assert.strictEqual(cancelled.status, 'CANCELLED');
    assert.throws(() => aps.cancelCloudJob(job.jobId), /finalizado/);

    const successJob = aps.submitRevitCloudJob('PRJ-42', {}, { appBundle: 'ArqVerticeValidator', workflow: 'validation' });
    const webhook = aps.handleWebhookEvent({ jobId: successJob.jobId, status: 'COMPLETED', progress: { stage: 'complete', percent: 100 }, output: { valid: true } });
    assert.strictEqual(webhook.status, 'COMPLETED');
    assert.strictEqual(aps.getCloudJob(successJob.jobId).status, 'SUCCESS');

    console.log('J42 APS Cloud BIM: all tests passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
