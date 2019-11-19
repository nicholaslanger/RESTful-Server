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
	//throw error for duplicates
	//var new_incedent = req.body.case_number;	
	var duplicate_id = false;
	var hold = 0;
	var new_incedent = {
		date: req.body.date,
		time: req.body.time,
		code: req.body.code,
		incident: req.body.incident,
		police_grid: req.body.police_grid,
		neighborhood_number: req.body.neighborhood_number,
		block: req.body.block
    };
	
	/*for(let i = 0; i<users.users.length;i++)
	{
		console.log("Loop " + i + ": " + users.users[i])
		if(users.users[i].id == new_user.id)
		{
		real_id = true;
		hold = i;
		}
	}*/
	
	if(!duplicate_id)
	{
		users.users[hold].name = req.body.name;
		users.users[hold].id = req.body.id;
		users.users[hold].email = req.body.email;
		res.status(200).send("The data has successfully been added");
	}
	else
	{
		res.status(500).send("The submitted case number already exists.");
	}	
	
	console.log(new_incedent);

});
	
console.log('Now Listening on port: ' + port);
var server = app.listen(port);