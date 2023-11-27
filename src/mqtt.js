'use strict'
const mqtt = require('mqtt')
const log = require('./logger')
const HOST_NAME = process.env.HOST_NAME || 'myhost'
const MQTT_HOST = process.env.MQTT_HOST || 'mqtt-broker'
const MQTT_PORT = process.env.MQTT_PORT || '1883'
const MQTT_USER = process.env.MQTT_USER || 'hassio'
const MQTT_PASS = process.env.MQTT_PASS || 'hassio'
const NAME_SPACE = process.env.POD_NAMESPACE || 'c3po'
const connectUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`
console.log(connectUrl)
const client = mqtt.connect(connectUrl, {
  clientId: `mqtt_${NAME_SPACE}`,
  clean: true,
  keepalive: 60,
  connectTimeout: 4000,
  username: MQTT_USER,
  password: MQTT_PASS,
  reconnectPeriod: 1000,
})
client.on('connect', ()=>{
  log.info('MQTT Connection successful...')
})
module.exports.publish = (topic, message, retain = false) =>{
  return new Promise((resolve, reject)=>{
    client.publish(topic, message, { qos: 1, retain: retain}, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
module.exports.registerSensor = (id, name, icon, unit)=>{
  return new Promise((resolve, reject)=>{
    let payload = {
      name: name,
      state_topic: `homeassistant/sensor/kube-${NAME_SPACE}/kube-${NAME_SPACE}_${id}/state`,
      availability_topic: `homeassistant/sensor/kube-${NAME_SPACE}/availability`,
      payload_available: 'Online',
      payload_not_available: 'Offline',
      unique_id: `kube-${NAME_SPACE}_${id}`,
      device: {
        identifiers: [`kube-${NAME_SPACE}`],
        manufacturer: 'Scuba',
        model: "Kube-Sensor",
        name: `kube-${NAME_SPACE}`
      }
    }
    if(icon) payload.icon = icon
    if(unit) payload.unit_of_measurement = unit
    client.publish(`homeassistant/sensor/kube-${NAME_SPACE}/kube-${NAME_SPACE}_${id}/config`, JSON.stringify(payload), { qos: 1, retain: true }, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
module.exports.sendSensorValue = (id, value)=>{
  return new Promise((resolve, reject)=>{
    client.publish(`homeassistant/sensor/kube-${NAME_SPACE}/kube-${NAME_SPACE}_${id}/state`, value, { qos: 1, retain: false }, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
module.exports.sendDeviceAvailability = (value)=>{
  return new Promise((resolve, reject)=>{
    client.publish(`homeassistant/sensor/kube-${NAME_SPACE}/availability`, value, { qos: 1, retain: false }, (error)=>{
      if(error) reject(error)
      resolve()
    })
  })
}
