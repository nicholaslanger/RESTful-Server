var fs = require('fs');
var path = require('path');
var express = require('express');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

var port = 8000;

//Initializing the server
var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
	if (err) {
		console.log("Error opening " + db_filename);
	}else {
		console.log("Now connected to " + db_filename);
	}
});

app.get('/codes', (req,res) => {
	db.all("SELECT * FROM Codes", (err, row)=> {
		if(err) {
			reject(err);
		}
		
		var solution = {};
		for(var key in row)
		{
			solution[("C" + row[key].code)] = row[key].incident_type;
		}
		
		
		for (var key in solution) {
			console.log(solution + ": " + solution[key]);
		}
		
		res.type("json").send(JSON.stringify(solution,null,4));			
	});
});

app.get('/neighborhoods', (req, res) => {
	db.all("SELECT * FROM Neighborhoods", (err, row)=> {
		if(err) {
			reject(err);
		}
		
		var solution = {};
		for(var key in row)
		{
			solution[("N" + row[key].neighborhood_number)] = row[key].neighborhood_name;
		}

		for (var key in solution) {
			console.log(solution[key]);
		}
		
		res.type("json").send(JSON.stringify(solution,null,4));			
	});
});

app.get('/incidents', (req, res) => {
	db.all("SELECT * FROM Incidents", (err, row)=> {
		if(err) {
			reject(err);
		}

		var solution = {};	
		for(var key in row)
		{
			solution[("I" + row[key].case_number)] = {
				"date": row[key].date_time.substring(0,10),
				"time": row[key].date_time.substring(11),
				"code": row[key].code,
				"incident": row[key].incident,
				"police_grid": row[key].police_grid,
				"neighborhood_number": row[key].neighborhood_number,
				"block": row[key].block
			};
		}
		
		res.type("json").send(JSON.stringify(solution,null,4));			
	});
});

app.put('/new-incident', (req, res) => {

	var sql = `INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) 
	VALUES (`+req.body.case_number;+`, `+req.body.date+`, `+req.body.code+`, `+req.body.incident+`, `+req.body.police_grid+`, `+req.body.neighborhood_number+`, `+req.body.block+`)`;

	db.all(sql, (err, row)=> {
		if(err) {
			reject(err);
		}
	});

});
	
console.log('Now Listening on port: ' + port);
var server = app.listen(port);