var express = require('express');

var app = express();

/*
(/service) 라우터에 위임된 항목 리스트 :
ex) /service/~(각 파일들에 있는 호출파람)
1. service/temp_service.js (라우터 경로)
2. service_gas_service.js (라우터 경로))
*/
/* 센서서비스가 추가되면 라우터 추가 */
//사용자 정의 모듈 호출(모듈경로)//
var function_tempservice_route = require('./temperature_service/temp_humi_service');
app.use('/service', function_tempservice_route);

var funtion_gasservice_route = require('./gas_service/gas_service');
app.use('/service', funtion_gasservice_route);

/*
(/data) 라우터에 위임된 항목 리스트 :
ex) data/data.js (라우터 경로)
*/
var function_data_sensorlist_route = require('./data_service/data.js');
app.use('/data', function_data_sensorlist_route);

app.listen(3000, function(){
    console.log('connected');
});