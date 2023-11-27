'use strict'
const k8s = require('@kubernetes/client-node');
const path = require('path')
const log = require('./logger')
const NAME_SPACE = process.env.POD_NAMESPACE || 'c3po'
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

const statefulSetListFn = () => k8sAppsApi.listNamespacedStatefulSet(NAME_SPACE);
const deploymentListFn = () => k8sAppsApi.listNamespacedDeployment(NAME_SPACE);
const statefulSetInformer = k8s.makeInformer(kc, path.join('/apis/apps/v1/namespaces', NAME_SPACE, 'statefulsets'), statefulSetListFn);
const deploymentInformer = k8s.makeInformer(kc, path.join('/apis/apps/v1/namespaces', NAME_SPACE, 'deployments'), deploymentListFn);
statefulSetInformer.on('error', (err) => {
    log.error(err);
    // Restart informer after 5sec
    setTimeout(() => {
        startInformer();
    }, 5000);
});
deploymentInformer.on('error', (err) => {
    log.error(err);
    // Restart informer after 5sec
    setTimeout(() => {
        startInformer();
    }, 5000);
});
const startInformer = async()=>{
  try{
    await statefulSetInformer.start()
    log.info(`${NAME_SPACE} statefulSetInformer started`)
    await deploymentInformer.start()
    log.info(`${NAME_SPACE} deploymentInformer started`)
  }catch(err){
    if(err?.body?.message){
      log.error(`Code: ${err.body.code}, Msg: ${err.body.message}`)
    }else{
      log.error(err)
    }
    setTimeout(startInformer, 5000)
  }
}
startInformer()
module.exports.statefulSetInformer = statefulSetInformer
module.exports.deploymentInformer = deploymentInformer
