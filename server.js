var fs = require('fs');
var path = require('path');
var express = require('express');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var js2xmlparser = require('js2xmlparser');

var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');
var port = 8000;

//Initializing the server
var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
		console.log("Error opening " + db_filename);
	}else {
		console.log("Now connected to " + db_filename);
	}
});

//---------------------------------------------------------//
	//Organization functions

function approveNums(num_list,testCase)
{
	var flag = true;
	if(num_list.length == 2)
	{
		var start = parseInt(num_list[0]);
		var end = parseInt(num_list[1]);
		if(start > end)
		{
			var hold = end;
			end = start;
			start = hold;
		}
	}
	else
	{
		var start = parseInt(num_list[0]);
		var end = Number.MAX_VALUE;
	}
	
	if(!(testCase >= start && testCase <= end))
	{
		flag = false;
	}
	return flag;
}

function afterStartDate(start_date,testCase)
{
	var flag = true;
	if(!(testCase >= start_date))
	{
		flag = false;
	}
	return flag;
}

function beforeEndDate(end_date,testCase)
{
	var flag = true;
	if(!(testCase <= end_date))
	{
		flag = false;
	}
	return flag;
}

//---------------------------------------------------------//

app.get('/codes', (req,res) => {
	db.all("SELECT * FROM Codes", (err, row)=> {
		if(err) {
			reject(err);
		}
		
		var solution = {};
		var codeFlag;
	
		for(var key in row)
		{			
			if(req.query.code)
			{
				codeFlag = approveNums(req.query.code.split(','),row[key].code);
			}
			else
			{
				codeFlag = true;
			}
				
			if(codeFlag)
			{
				solution[("C" + row[key].code)] = row[key].incident_type;
			}
		}
				
		//HANDLING ?format query
		if(req.query.format == 'xml')
		{
			res.type("xml").send(js2xmlparser.parse("codes",solution));
		}
		else
		{
			res.type("json").send(JSON.stringify(solution,null,4));	
		}			
	});
});

app.get('/neighborhoods', (req, res) => {
	db.all("SELECT * FROM Neighborhoods", (err, row)=> {
		if(err) {
			reject(err);
		}
		
		var solution = {};
		var neighbor_numFlag;
		
		for(var key in row)
		{
			if(req.query.id)
			{
				neighbor_numFlag = approveNums(req.query.id.split(','),row[key].neighborhood_number);
			}
			else
			{
				neighbor_numFlag = true;
			}
			
			if(neighbor_numFlag)
			{
				solution[("N" + row[key].neighborhood_number)] = row[key].neighborhood_name;
			}
		}
		
		if(req.query.format == "xml")
		{
			res.type("xml").send(js2xmlparser.parse("neighborhoods",solution));
		}
		else
		{
			res.type("json").send(JSON.stringify(solution,null,4));	
		}
	});
});

app.get('/incidents', (req, res) => {
	db.all("SELECT * FROM Incidents", (err, row)=> {
		if(err) {
			reject(err);
		}

		var solution = {};	
		var count = 0;
		var startFlag;
		var endFlag;
		var codeFlag;
		var gridFlag;
		var neighbor_numFlag;
		
		for(var key in row){
			if (count == 10000){
				break;
			}
			else if(req.query.limit && req.query.limit == count)
			{
				break;
			}
			else
			{
				//START DATE
				if(req.query.start_date)
				{
					startFlag = afterStartDate((req.query.start_date.replace(/-/g,"")),parseInt(row[key].date_time.substring(0,10).replace(/-/g,"")));
				}
				
				//END DATE
				if(req.query.end_date)
				{
					endFlag = beforeEndDate((req.query.end_date.replace(/-/g,"")),parseInt(row[key].date_time.substring(0,10).replace(/-/g,"")));
				}
				
				//CODE
				if(req.query.code)
				{
					codeFlag = approveNums(req.query.code.split(','),row[key].code)
				}
				
				//POLICE GRID
				if(req.query.grid)
				{
					gridFlag = approveNums(req.query.grid.split(','),row[key].police_grid);
				}
				
				//ID
				if(req.query.id)
				{
					neighbor_numFlag = approveNums(req.query.id.split(','),row[key].neighborhood_number);
				}
				
				if(startFlag && endFlag && codeFlag && gridFlag && neighbor_numFlag)
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
					count++;
				}
			}
		}
		
		if (req.query.format == 'xml'){
			res.type("xml").send(js2xmlparser.parse("incidents",solution));
		}else{
			res.type("json").send(JSON.stringify(solution,null,4));
		}					
	});
});

app.put('/new-incident', (req, res) => {

	var insert_sql = `INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) 
		VALUES ('`+req.body.case_number+`', '`+req.body.date+`T`+req.body.time+`', `+req.body.code+`, '`+req.body.incident+`', `+req.body.police_grid+`, `+req.body.neighborhood_number+`, '`+req.body.block+`');`;

	var check_sql = `SELECT case_number FROM Incidents WHERE case_number = ` + req.body.case_number+`;`

	var promise1 = new Promise((resolve, reject) =>{
		db.all(check_sql, (err, rows)=>{
			if (rows.length > 0){
				resolve();
			}else{
				reject();
			}
		});
	});

	promise1.then(()=>{
		res.type("text").status(500).send("thats already been added to the db!!");
	}).catch(()=>{
		db.run(insert_sql, (err)=> {
			if(err) {
				console.log(err);
			}else{
				res.type("text").status(200).send("great success! very nice!");
			}
		});

	});
});
	
console.log('Now Listening on port: ' + port);
var server = app.listen(port);