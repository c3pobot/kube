'use strict'
const log = require('./logger')
const mqtt = require('./mqtt')
const { statefulSetInformer, deploymentInformer } = require('./kube')
const icon = 'mdi:kubernetes'
let statefulsetsList = [], deploymentsList = []
statefulSetInformer.on('add', (obj) => {
  if(obj?.metadata?.name && obj?.status && obj?.spec) registerSensor(obj)
});
statefulSetInformer.on('update', (obj) => {
  if(obj?.metadata?.name && obj?.status && obj?.spec) sendSensorValue(obj)
});
deploymentInformer.on('add', (obj) => {
  if(obj?.metadata?.name && obj?.status && obj?.spec) registerSensor(obj)
});
deploymentInformer.on('update', (obj) => {
  if(obj?.metadata?.name && obj?.status && obj?.spec) sendSensorValue(obj)
});
const registerSensor = async(obj = {})=>{
  try{
    await mqtt.registerSensor(`${obj.metadata.name.toLowerCase()}_requested_replicas`, `${obj.metadata.name} requested`, icon, null)
    await mqtt.registerSensor(`${obj.metadata.name.toLowerCase()}_available_replicas`, `${obj.metadata.name} available`, icon, null)
    await mqtt.registerSensor(`${obj.metadata.name.toLowerCase()}_status`, `${obj.metadata.name} status`, icon, null)
    sendSensorValue(obj)
  }catch(e){
    log.error(e);
  }
}
const sendSensorValue = async(obj = {})=>{
  try{
    await mqtt.sendDeviceAvailability('Online')
    await mqtt.sendSensorValue(`${obj.metadata.name.toLowerCase()}_requested_replicas`, `${obj.spec.replicas}`)
    await mqtt.sendSensorValue(`${obj.metadata.name.toLowerCase()}_available_replicas`, `${obj.status.availableReplicas}`)
    await mqtt.sendSensorValue(`${obj.metadata.name.toLowerCase()}_status`, `${obj?.status?.availableReplicas} / ${obj?.spec?.replicas}`)
  }catch(e){
    log.error(e);
  }
}
