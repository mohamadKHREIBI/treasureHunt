
 //var jquery = require("imports-loader?$=../../libs/jQuery.1.4.2.js!myjqPlugin");
 import './jquery-1.4.2';
 import './rdf_store';
 import './rdfquery';
 import './knockout-1.2.1';
 

 //var jsonld = require('./jsonld.min');
 var rdfstore = require('rdfstore');

 const APPACH_PORT="8080"
 const DBURL = 'http://localhost:'+APPACH_PORT+'/rdfdb/testGame.owl';
 const GAMEURL = '<urn:absolute:www.espritgaming.com/stage1/';


let mypromise= new Promise((resolve,reject)=>{
	rdfstore.create(function(err, store) {
		$.ajax({
		  url: DBURL,
		  success: function(data) {
			store.load('text/turtle', data, function(err, results) {
				if(err)
					reject("oops");
				resolve(store);
			});
		  }
		});
	  });

})



//designer

function drowMap(){
	let map=$("#map");
	let html="";
	for(let i=0;i<10;i++)
	{
		html+="<tr class='brick'>"
		for(let j=0;j<10;j++)
		{
			html+=`<td id="p${i}${j}" class="brick"></td>`
		}
		html+="</tr>"

	}	
	map.append(html)
}



function drowPo(lst){

lst.forEach(e=>{
	let id= e.replace('urn:absolute:www.espritgaming.com/stage1/','');
	$("#"+id).removeClass("brick");
	$("#"+id).addClass("green");
	$("#"+id).click(clickHandler);
})



}


function drowUser(idToDrow){
	$("td").text("");
	$("#"+idToDrow).text("user");
}

//services
function getCurrentLocation(cb){
mypromise.then((mystore)=>{
	let query = `select ?x { ?y ${GAMEURL}currentLocation> ?x }`;
  
	mystore.execute(query, function(err, results) {
	  let currentLocation = results[0].x.value.replace(
		'urn:absolute:www.espritgaming.com/stage1/',
		''
	  );
	  cb(currentLocation);
	});
});

}



function getNeighbors(currentLocation, cb) {

	mypromise.then((mystore)=>{

		let query = `select ?x  { 
			?y  ${GAMEURL}localisationNeighbor> ?x
			filter ( ?y = ${GAMEURL}${currentLocation}> ) 
		  }`;
		mystore.execute(query, function(err, results) {
		  let neighbors = [];
		  results.forEach(r => {
			neighbors.push(
			  r.x.value.replace('urn:absolute:www.espritgaming.com/stage1/', '')
			);
		  });
		  cb(neighbors);
		});

	})

  }


  function isMovePossible(destination,cb){

		getCurrentLocation((currentLocation)=>{
			getNeighbors(currentLocation,(neighbors)=>{
				if(neighbors.filter(e=>e==destination).length!=0)
					{  
						moveOneStep(destination)
					}
				else	
					console.log("can t do this move");
			})
		})
  }


  function moveOneStep(destination,cb){
	mypromise.then((mystore)=>{
		getCurrentLocation((data)=>{
			mystore.execute(
			  `
				PREFIX ex:<urn:absolute:www.espritgaming.com/stage1/>
				DELETE { ?c ex:currentLocation ex:${data} }
				INSERT { ?c ex:currentLocation ex:${destination} }
				WHERE {
				  ?c ex:currentLocation ex:${data}
				}`,
			  function(err, results) {
					drowUser(destination);
					checkToUpdateHealth(destination)
					getCurrentRoom((data)=>{
						if(lastRoomLocation!=data)
						{ lastRoomLocation=data;
							checkGardsOrTreasure(data);
						}
						
					})
			
			  }
			);
		})
	})
  }






function getHealthPlayer(cb){
	mypromise.then((mystore)=>{
		mystore.execute(`
		PREFIX ex: <urn:absolute:www.espritgaming.com/stage1/>
		select ?z { ex:Hunter ex:health  ?z }
		`,function(err,data){
			cb(data[0].z.value)
		})
	})

}




function updateHealthPlayer(toAdd,health){
			

	mypromise.then((mystore)=>{

		let hp=toAdd + health > 100 ? 100 : toAdd+health;
			mystore.execute(
					`
						PREFIX ex:<urn:absolute:www.espritgaming.com/stage1/>
						DELETE { ex:Hunter ex:health  ?z }
						INSERT { ex:Hunter ex:health  ${hp} }
						WHERE {
						ex:Hunter ex:health  ?z 
						}
					 `,
		function(err, results) {
				//showHelth();
			getHealthPlayer((e)=>console.log(e +" from test"))
		}
	);

})
		




}


function checkToUpdateHealth(id){
	checkTrap(id,(data)=>{
		mypromise.then((mystore)=>{
			mystore.execute(`
				PREFIX ex: <urn:absolute:www.espritgaming.com/stage1/>
				select ?x { ex:${data} ex:hp ?x }
			`,function(err,res){
					let toadd=res[0].x.value;
					getHealthPlayer((r)=>updateHealthPlayer(parseInt(toadd),parseInt(r)));		
			})
		})
	})
}

function checkTrap(id,cb)
{
	mypromise.then((mystore) => {
		mystore.execute(`
		PREFIX ex: <urn:absolute:www.espritgaming.com/stage1/>
		SELECT ?o {
			ex:${id} ex:hasMagic ?o
		}
		`,function(err,data){
			if(data.length !=0)
				cb(data[0].o.value)
		})

	})
}



function getCurrentRoom(cb)
{

	getCurrentLocation((idlocal)=>{
			mypromise.then((mystore)=>{
				mystore.execute(`
				PREFIX ex: <urn:absolute:www.espritgaming.com/stage1/>
				SELECT ?r { ex:${idlocal} ex:childOf ?r}
		`,function(err,res){
				cb(res[0].r.value);
		})
			})
	})
}


function checkGardsOrTreasure(room){
	room=room.replace('urn:absolute:www.espritgaming.com/stage1/','');
	mypromise.then((mystore)=>{
			mystore.execute(`
					PREFIX ex: <urn:absolute:www.espritgaming.com/stage1/>
					SELECT ?surprise {
						ex:${room} ex:hasSurprise ?surprise
					}
			`,function(err,res){
				if(res.length!=0)
					{
						let surprise=res[0].surprise.value;
						if(surprise !== "flouss")
								activeGard(surprise);
						else	
							alert("you won !!")
					}
			})
	})
}


function activeGard(gard){
	mypromise.then(mystore=>{


					mystore.execute(`
					PREFIX ex: <urn:absolute:www.espritgaming.com/stage1/>
					select ?q  ?a ?attNbr ?f ?v{
						ex:${gard} ex:question ?q.
						ex:${gard} ex:answer ?a.
						ex:${gard} ex:attemptNbr ?attNbr.
						ex:${gard} ex:inFailure ?f.
						ex:${gard} ex:isVisited ?v
					}
			`,function(err,res){
					let gardInfo=res[0];
						gardInfo={
							q:gardInfo.q.value,
							a:gardInfo.a.value,
							attNbr:parseInt(gardInfo.attNbr.value),
							f:gardInfo.f.value,
							v:(gardInfo.v.value==="true")
						}
						console.log(gardInfo)
					if(!gardInfo.v)
						{
							let answer;
							gardInfo.v=true;
							let ok=false;
							while(ok==false && gardInfo.attNbr>0)
							{
								answer=prompt(gardInfo.q);
								if (answer.toUpperCase() === gardInfo.a.toUpperCase())
									ok=true;
								gardInfo.attNbr--;
							}
							if(!ok)
								moveOneStep(gardInfo.f)
								gardInfo.id=gard;
								//gardVisitPersist(gardInfo);
						}
			});

	})
}



function gardVisitPersist(gard){
	mypromise.then((mystore)=>{
		console.log(gard.id)
		mystore.execute(`
			PREFIX ex: <urn:absolute:www.espritgaming.com/stage1/>
			DELETE {
				ex:${gard.id} ex:isVisited ?p
			}
			INSERT { 
				ex:${gard.id} ex:isVisited "true" }
			 }
			 WHERE
			 {
				ex:${gard.id} ex:isVisited ?p
			 }
		`,function(err,res){
				
		})
	})
}
function getMapNodes2(cb){
	mypromise.then((mystore)=>{
		mystore.execute(`SELECT DISTINCT ?subject
						WHERE{
							?subject a <urn:absolute:www.espritgaming.com/stage1/LOCALISATION>
						}`,function(err,res){
							cb(res)
						})
	})
}

/****main */
let lastRoomLocation;
getCurrentRoom((data)=>{
	lastRoomLocation=data;
});


  drowMap();
  drowUser('p00','p00');
getMapNodes2((data)=>{
	drowPo(data.map(e=>e.subject.value))
})



function fakecallback(){}





function clickHandler(event){
	let id=event.target.id;
	isMovePossible(id,function(){
		getHealthPlayer((data)=>{
			let hpscreen=$("#hp")
			hpscreen.text(data)
			if(data > 40)
				hpscreen.css("color:green")

			if(data<=40 && data>20)
				hpscreen.css("color:orange")

				if(data <= 20)
				hpscreen.css("color:red")

	});
	});
}