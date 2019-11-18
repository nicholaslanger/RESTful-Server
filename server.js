var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

var port = 8000;
//_dirname = current directory location

/*
var users;
var users_FileName = path.join(__dirname, 'users.json');
fs.readFile(users_FileName, (err, data) => {
	if(err)
	{
		console.log("Error reading users.json");
		users = {users: []};
	}
	else
	{
		users = JSON.parse(data);
	}
}); 
*/

//Initializing the server
var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));

//--------------------------------------------------------------------//
//Returns a JSON object with a list of codes and their respective incident.
//Prepend a "C" to the codes when printing.

/*
	Example...
		"C110": "Murder, Non Negligent Manslaughter",
		"C120": "Murder, Manslaughter By Negligence",
		"C210": "Rape, By Force",
		...
*/

app.get('/codes', (req,res) => {
	//return data in file
	var limited_users;
	var template;
	var size;
	var array;
	//console.log("limit: " + req.query.limit);
	if(req.query.limit)
	{
		size = parseInt(req.query.limit);
		//console.log("Size: " + size);
		array = new Array(size);
		limited_users = {users: array};
		//console.log("Limited_users: " + limited_users);
		
		for(let i = 0;i<size;i++)
		{
			template = {
				id: users.users[i].id,
			    name: users.users[i].name,
			    email: users.users[i].email
			};
			limited_users.users[i] = template;
		}
		res.type('json').send(limited_users)
	}
	else
	{
		res.type('json').send(users);
	}
});

//--------------------------------------------------------------------//
//Returns a JSON object with a list of neighborhood id's and their
//corresponding neighborhood name.
//Prepend a "N" to the id's

/* 
	Example...
		"N1": "Conway/Battlecreek/Highwood",
		"N2": "Greater East Side",
		"N3": "West Side",
		"N4": "Dayton's Bluff",
		...
*/

app.get('/neighborhoods', (req, res) => {
	//Add new file to object
	var new_user = {
		id: parseInt(req.body.id, 10),
		name: req.body.name,
		email: req.body.email
	};
	var has_id = false;
	for(let i = 0; i<users.users.length;i++)
	{
		console.log("Loop " + i + ": " + users.users[i])
		if(users.users[i].id === new_user.id)
		{
			has_id = true;
		}
	}
	console.log(has_id);
	if(has_id)
	{
		res.status(500).send('Error');
	}
	else 
	{
		users.users.push(new_user);
		fs.writeFile(users_FileName,JSON.stringify(users, null, 4), (err) => {
			res.status(200).send('success');
		});
	}
});

//--------------------------------------------------------------------//
//Returns a JSON object with a list of crim incidents. 
//Make date and time seperate fields.
//Prepend a "I" to the incident numbers/id'savePreferences

/*
	Example...
		"I19245020": {
		"date": "2019-10-30",
		"time": "23:57:08",
		"code": 9954,
		"incident": "Proactive Police Visit",
		"police_grid": 87,
		"neighborhood_number": 7,
		"block": "THOMAS AV  & VICTORIA"
		}
*/

app.get('/incidents', (req, res) => {
		//remove file from object
		var real_id = false;
		var hold = 0;
		var id_num = parseInt(req.body.id, 10);
		for(let i = 0; i<users.users.length;i++)
		{
			console.log("Loop " + i + ": " + users.users[i])
			if(users.users[i].id === id_num)
			{
			real_id = true;
			hold = i;
			}
		}
		if(real_id)
		{
			users.users.splice(hold, 1);
		}
		else
		{
			res.status(500).send('Failed Meme');
		}
		
	});
	
//--------------------------------------------------------------------//
//Upload incident data to the database
//Note: response should reject status 500 (case_number already exists).
/*
	Parameters...
		case_number
		date
		timecode
		incident
		police_grid
		neighborhood_number
		block
*/

app.put('/new-incident', (req, res) => {
		//edit file in object
		var real_id = false;
		var hold = 0;
		var new_user = {
		id: parseInt(req.body.id, 10),
		name: req.body.name,
		email: req.body.email
		};
		for(let i = 0; i<users.users.length;i++)
		{
			console.log("Loop " + i + ": " + users.users[i])
			if(users.users[i].id == new_user.id)
			{
			real_id = true;
			hold = i;
			}
		}
		if(real_id)
		{
			users.users[hold].name = req.body.name;
			users.users[hold].id = req.body.id;
			users.users[hold].email = req.body.email;
			res.status(200).send("Successful Meme");
		}
		else
		{
			res.status(500).send('Failed Meme');
		}						
	});
	
//--------------------------------------------------------------------//
//Starting the server
console.log('Now Listening on port: ' + port);
var server = app.listen(port);