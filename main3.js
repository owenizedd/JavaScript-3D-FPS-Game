var canvas = document.getElementById('mycanvas');
var engine = new BABYLON.Engine(canvas,true);
var playerspeed=  0.5;
const pistolRotationZ = -Math.PI/128;
const cameraPositionY = 3.01;

var NightWorldPos = {
  x : 1000,
  z : 1000,
  y : 1,
};

var enemys = [];

function createSkyBox(name,path,scene){
  var skybox = BABYLON.MeshBuilder.CreateBox(name, {size: 400, updatable: true}, scene);
  skybox.ellipsoid= new BABYLON.Vector3(3,3,3);
  skybox.checkCollisions=true;
  
  var skyboxMaterial = new BABYLON.StandardMaterial(name +"_env", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.HDRCubeTexture(path, scene, 512);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.alpha=0.8;
  skybox.material = skyboxMaterial;
  return skybox;
}
function getMaterial(name,r,g,b,scene){
  var mat = new BABYLON.StandardMaterial(name,scene);
  mat.diffuseColor=new BABYLON.Color3(r,g,b);
  return mat;
}

//from babylon website.
//used for finding control name from GUI, hanya root control yang dapat di search.
BABYLON.GUI.AdvancedDynamicTexture.prototype.getControlByName = function (name) {
  var foundControl = null;
  if (name) {
      this.executeOnAllControls(function(control) {
          if(control.name && control.name === name){
              foundControl = control;
          }
      }, this._rootContainer);
  }
  return foundControl;
};

//==========MAIN GAME FUNCTION=============
function createScene(){
  var scene = new BABYLON.Scene(engine);
 
  // var camera2 = new BABYLON.ArcRotateCamera("arcRotCam", -Math.PI/2, Math.PI/2, 5, new BABYLON.Vector3(0,11,-25), scene);
  var camera = new BABYLON.FreeCamera("freeCam1", new BABYLON.Vector3(0,cameraPositionY,0), scene);
  camera.ellipsoid = new BABYLON.Vector3(1.3,1,1.3);
  camera.keysLeft= [65];
  camera.keysRight=[68];
  camera.keysUp = [87];
  camera.keysDown = [83];
  //camera.layerMask = 2;
  //camera.inertia = 0.9;

  camera.speed = this.playerspeed;
  setPointerLock(camera);
  
 // camera.collisionRadius = new BABYLON.Vector3(1,1,1); //collision terjadi ketika 2 dari mesh (untuk arcrotate)
 camera.attachControl(canvas,false);

  var hemlight1 = new BABYLON.HemisphericLight("hemiLight1", new BABYLON.Vector3(0,11,0),scene);
  hemlight1.intensity=0.5;

  var spotlight1 = new BABYLON.PointLight("ponitLight1", new BABYLON.Vector3(0, 70, 0), scene);
  spotlight1.intensity=1;
  var shadowGenerator = new BABYLON.ShadowGenerator(1024, spotlight1);//aktifkan bayangan
  shadowGenerator.useBlurExponentialShadowMap=true;//haluskan bayangan

  var skybox = createSkyBox("environment1", "textures/skybox_textures/TelurGulungEnvironment.hdr", scene);


  var ground = new BABYLON.Mesh.CreateGround("ground1", 400, 400, 1, scene, true);
  
  ground.position.y=1;
  var grassMaterial = new BABYLON.StandardMaterial("matGrass", scene);
  grassMaterial.diffuseTexture = new BABYLON.Texture("textures/ground.jpg",scene);
  grassMaterial.diffuseTexture.uOffset = 0.2;
  grassMaterial.diffuseTexture.vOffset = 0.2;
  grassMaterial.diffuseTexture.uScale = 100;
  grassMaterial.diffuseTexture.vScale = 100;
  ground.material = grassMaterial;
  ground.checkCollisions=true;
  ground.receiveShadows = true;
  ground.thickness = 2;
  //set gravity so the player webkitPointerLockElement go down and check collision
  scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
  scene.collisionsEnabled = true;
  
  //set gravity to camera.
  camera.applyGravity = true;
  camera.checkCollisions=true;

  //generate box dengan random position
  let wood_mat = new BABYLON.StandardMaterial("woodMat",scene);
  wood_mat.diffuseTexture = new BABYLON.Texture("textures/crate.png", scene);
  wood_mat.diffuseTexture.hasAlpha = true;
  for(let i = 0; i < 50; i++){
    
    let wood_box = new BABYLON.Mesh.CreateBox("Box" + i, 3, scene);
    wood_box.material=wood_mat;
    
    wood_box.position.y=2.5;
    wood_box.position.z=Math.random()*250 - Math.random()*250;//randomized;
    wood_box.position.x=Math.random()*250 - Math.random()*250;
    wood_box.checkCollisions=true;
    wood_box.applyGravity=true;
    wood_box.isPickable=true;
    wood_box.visible=true;
    wood_box.enabled=true;
    shadowGenerator.getShadowMap().renderList.push(wood_box);//masukan mesh ke shadowGen
    
  }

  //=====AMBIL MESH EXT
  var assetsManager = new BABYLON.AssetsManager(scene);
  var meshTask = assetsManager.addMeshTask("gun", "" , "scenes/" , "mypistol_new.babylon");

  //dunia kedua (maybe cancel)
  var meshTask2 = assetsManager.addMeshTask("secondWorld", "", "scenes/", "new_world.babylon");
  // meshTask.runTask();
  // meshTask.run();
  var weapon;
  var enemy;

  //first .babylon
  meshTask.onSuccess = function(task){
    console.log("Success di load gan, total mesh: " + task.loadedMeshes.length);
    task.loadedMeshes.reverse();
    task.loadedMeshes[0].position = BABYLON.Vector3.Zero();
    task.loadedMeshes[0].name="mypistol";//object pistol
    weapon = task.loadedMeshes[0];
    weapon.position.y=-0.3;
    weapon.applyGravity=true; 
    weapon.position.z = 1;
    weapon.position.x = 0.93;
    weapon.rotation.y = Math.PI/2 - Math.PI/32;
    weapon.rotation.z = pistolRotationZ;
    weapon.scaling.y = -0.1;
    weapon.scaling.x = -0.1;
    weapon.scaling.z = -0.03;
    weapon.parent = camera;
    
    if (task.loadedMeshes.length>1){
      enemy = task.loadedMeshes[1];//object musuh
      enemy.position = BABYLON.Vector3.Zero();
      enemy.position.y = 2.6;
      enemy.scaling.y -= 0.4;
      enemy.name="enem1";
      enemy.checkCollisions=true;
      enemy.applyGravity=true;
      //face to cam
      enemy.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      enemy.rotation.y+=1.5;
      const healthBar = generateHealthBar(1);
      enemyAdvancedTexture.addControl(healthBar);
      healthBar.linkWithMesh(enemy);
      healthBar.linkOffsetY = -20;
      generateEnemy(enemy,shadowGenerator);
      enemy.isVisible=false;
      enemy.checkCollisions=false;
      generateEnemyAmountText();
    }
    else{
      console.log("Enemy tidak dapat di load gan.");
    }
  }

  //second .babylon ()
  // meshTask2.onSuccess = function(task){
  //   console.log("Success di load gan, total mesh babylon kedua : " + task.loadedMeshes.length);
  //   task.loadedMeshes.reverse();
  //   task.loadedMeshes[0].position = BABYLON.Vector3.Zero();
  //   task.loadedMeshes[0].position.z = Math.random()*100 - Math.random()*100;
  //   task.loadedMeshes[0].position.x = Math.random()*100 - Math.random()*100;

  // }

  assetsManager.onTaskErrorObservable.add(function(task) {
    console.log("===ontTaskErrorObserbable===");
    console.log('task failed', task.errorObject.message, task.errorObject.exception);
  });

  assetsManager.onFinish = function(tasks){

    scene.render();
    

  }

  assetsManager.load(); //ambil mesh external


  //activate event listener for click (fire)
  var fireSound = new BABYLON.Sound("gunfire","audio/gunshot.wav",scene,null, {volume: 0.15});
  var aboutShow = 0;


  var totalEnemyText = new BABYLON.GUI.TextBlock();
  scene.onPointerDown = function(evt,pickerResult){
    var height = scene.getEngine().getRenderHeight();
    var width = scene.getEngine().getRenderWidth();

    //buat PickerResult sendiri
    var mypick = scene.pick(width/2, height/2, null, null, camera); 
    if(mypick.hit){
      // if (mypick.pickedMesh.name.indexOf("Box") != -1){//second world
      //   camera.position.x = NightWorldPos.x;
      //   camera.position.y = NightWorldPos.y + 20;
      //   camera.position.z = NightWorldPos.z;
      // }
      // else 
      if (mypick.pickedMesh.name.indexOf("ene")!=-1){ //enemy
        mypick.pickedMesh.translate(new BABYLON.Vector3.Backward(), 0.3 );
        //do something with mypick.pickedMesh
        const hittedEnemyName= mypick.pickedMesh.name.replace("enem", "health-");
        console.log(hittedEnemyName);
        const selectedControl = enemyAdvancedTexture.getControlByName(hittedEnemyName);

        const widthInNumber = +selectedControl.width.slice(0,2);
        selectedControl.width = (widthInNumber-10) + 'px';
        console.log(selectedControl);
        if (widthInNumber <= 10){
          mypick.pickedMesh.dispose(); //destroy the mesh
          generateEnemyAmountText();
          gameOverCheck();
        }
        
      }
      else if(mypick.pickedMesh.name.indexOf("about")!=-1 && aboutShow==0){//about
        aboutBox.alpha=1;
        aboutShow = 1;
      }
      else if(aboutShow==1){//about
        aboutBox.alpha = 0;
        aboutShow = 0;
        
      }
    }

    animShot(weapon,scene,fireSound);
  }
  scene.onKeyboardObservable.add((e)=>{
    if (e.event.keyCode == 32){
      activateJumpPlayer(camera,scene);
    }
  });
    
  // GUI
  var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  addAboutText(advancedTexture,scene);
  var aboutBox = advancedTexture.getControlByName("container");
  
  //Lantai dua (di komen karena di cancel)

  // var ground2 = new BABYLON.Mesh.CreateGround("ground2", 400, 400, 1, scene, true);
  // ground2.position.y = 1;
  // ground2.position.x = NightWorldPos.x;
  // ground2.position.z = NightWorldPos.z;
  // var ground2_mat = new BABYLON.StandardMaterial("matRock",scene);
  // ground2_mat.diffuseTexture = new BABYLON.Texture("textures/rock.jpg",scene);
  // ground2_mat.diffuseTexture.uOffset = 0.2;
  // ground2_mat.diffuseTexture.vOffset = 0.2;
  // ground2_mat.diffuseTexture.uScale = 100;
  // ground2_mat.diffuseTexture.vScale = 100;
  // ground2.material = ground2_mat;
  // ground2.checkCollisions=true;
  // ground2.receiveShadows = true;
  // ground2.isVisible = true;
  
  //after everything done, active the crosshair
  document.getElementsByTagName('img')[0].style='display: block';
  return scene;
}

var scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
  moveEnemy();
});

window.addEventListener('resize', ()=>{
  engine.resize();  
});

window.addEventListener('click', ()=>{
  var pickResult =scene.pick(scene.pointerX, scene.pointerY);
});

function setPointerLock(camera){
  var _this = this;
  // Request pointer lock
  var canvas = _this.canvas;
  canvas.addEventListener("click", function(evt) {
      canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
      if (canvas.requestPointerLock) {//jika bisa
          
          canvas.requestPointerLock();
      }
  }, false);

  // Event listener when the pointerlock is updated.
  var pointerlockchange = function (event) {
      _this.controlEnabled = (document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas || document.msPointerLockElement === canvas || document.pointerLockElement === canvas);
      if (!_this.controlEnabled) {
          camera.detachControl(canvas);
      } else {
          camera.attachControl(canvas);
          
      }
  };
  document.addEventListener("pointerlockchange", pointerlockchange, false);
  document.addEventListener("mspointerlockchange", pointerlockchange, false);
  document.addEventListener("mozpointerlockchange", pointerlockchange, false);
  document.addEventListener("webkitpointerlockchange", pointerlockchange, false);

}


function animShot(weapon,scene,fireSound){
  var anim = new BABYLON.Animation("moveUp","rotation.z", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

  var key = [];

  //handling rotation.z bug when user rapidly click the mouse.
  if (weapon.rotation.z < pistolRotationZ) weapon.rotation.z = pistolRotationZ;
  
  key.push({
    frame: 0,
    value: weapon.rotation.z,
  });

  key.push({
    frame: 0.3,
    value: weapon.rotation.z-0.1,
  });

  key.push({
    frame: 10,
    value: weapon.rotation.z,
  });

  anim.setKeys(key);

  fireSound.play();

  weapon.animations.push(anim);
  scene.beginAnimation(weapon,0,10);
}


function activateJumpPlayer(camera, scene){
  var anim = new BABYLON.Animation("jump", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
  var keys = [];

  //if for preventing flying
  if (camera.position.y == cameraPositionY) {
    camera.applyGravity=false;
    keys.push({
      frame: 0,
      value: cameraPositionY,
    });
    keys.push({
      frame: 6,
      value: cameraPositionY+0.5,     
    });
    keys.push({
      frame: 10,
      value: cameraPositionY,
    });
    anim.setKeys(keys);
    camera.animations.push(anim);
    scene.beginAnimation(camera,0,10);
    camera.applyGravity=true;
  }
}

const enemyAdvancedTexture = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI2");
function generateHealthBar(index) {
  let healthBar =   new BABYLON.GUI.Rectangle();
  healthBar.width='30px';
  healthBar.height = '8px';
  healthBar.background = '#CC0000';
  healthBar.name='health-' + index;
  healthBar.linkOffsetY = -20;
  return healthBar;
};

function generateEnemy(enemy,shadowGenerator){

  for(let i = 2; i<=12; i++){
    let healthBar = generateHealthBar(i);
    let enem = enemy.clone("enem" + i, null);
    enem.position.z=(Math.random()*200+40) - (Math.random()*200+40);
    enem.position.x=(Math.random()*200+40) - (Math.random()*200+40);
    shadowGenerator.getShadowMap().renderList.push(enem);//masukan mesh ke shadowGen
    enemys.push(enem);
    enemyAdvancedTexture.addControl(healthBar);
    healthBar.linkWithMesh(enem);
  }
}

function moveEnemy(){
  for(let i = 0; i<enemys.length; i++){
    if (enemys[i]._isDisposed) continue;

    let initX = enemys[i].position.x;
    let initZ = enemys[i].position.z;
    let camWidth = 2;//untuk kalkulasi (not too close)
    let moveX = 0, moveZ = 0;

    //a little algorithm
    if (initX <= scene.activeCamera.position.x - camWidth) moveX = 0.1;
    if (initX >= scene.activeCamera.position.x + camWidth) moveX = -0.1;
    if (initZ <= scene.activeCamera.position.z - camWidth) moveZ = 0.1;
    if (initZ >= scene.activeCamera.position.z + camWidth) moveZ = -0.1;
    BABYLON.Animation.CreateAndStartAnimation("moveEnemyX",enemys[i],"position.x",30,10,initX,initX + moveX,false);
    BABYLON.Animation.CreateAndStartAnimation("moveEnemyZ",enemys[i],"position.z",30,10,initZ,initZ + moveZ,false);

  }
}

function addAboutText(advancedTexture,scene){

  var aboutBox = new BABYLON.Mesh.CreateSphere("aboutbx",5,13,scene,true);

  
  aboutBox.position.y= 150;
  aboutBox.position.z= 75;
  aboutBox.position.x= 0;

  var triggerContainer =   new BABYLON.GUI.Rectangle();
  triggerContainer.name = "triggercontainer";
  triggerContainer.width = '100px';
  triggerContainer.height = '50px';
  triggerContainer.cornerRadius = 10;
  triggerContainer.color = "#67A0D1";
  triggerContainer.thickness =  2;
  triggerContainer.background = "#21352B";
  advancedTexture.addControl(triggerContainer);
  triggerContainer.linkWithMesh(aboutBox);
  triggerContainer.linkOffsetX=100;

  var aboutText = new BABYLON.GUI.TextBlock();
  aboutText.text="About";
  aboutText.fontSize = 16;

  triggerContainer.addControl(aboutText);

  var textContainer = new BABYLON.GUI.Rectangle();
  textContainer.name = "container";
  textContainer.width = '800px';
  textContainer.height = '150px';
  textContainer.cornerRadius = 20;
  textContainer.color = "#67A0D1";
  textContainer.thickness =  2;
  textContainer.background = "#21352B";
  textContainer.alpha = 0;
  advancedTexture.addControl(textContainer);  

  var text1 = new BABYLON.GUI.TextBlock();
  text1.text = "3D FPS Game built in Babylon.js with <3";
  text1.fontSize = 24;
  text1.top = -50;
  textContainer.addControl(text1);

  var text2 = new BABYLON.GUI.TextBlock();
  text2.text = "Made in 2018 by: Ryan Owen Thionanda";
  text2.fontSize = 16;
  text2.top = 0;
  textContainer.addControl(text2);

  
  textContainer.linkWithMesh(aboutBox);
  textContainer.linkOffsetY = -10;

  return textContainer;
}


function gameOverCheck(){  
  let existEnemy = false;
  for(let i = 0; i<enemys.length; i++){
    if (!enemys[i]._isDisposed) existEnemy = true ;
  }
  if (!existEnemy){
    const endGameContainer = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("gameover");
    var boxContainer =   new BABYLON.GUI.Rectangle();
    boxContainer.name = "triggercontainer";
    boxContainer.width = '100%';
    boxContainer.height = '50px';
    boxContainer.cornerRadius = 10;
    boxContainer.color = "#67A0D1";
    boxContainer.thickness =  2;
    boxContainer.background = "#21352B";
    endGameContainer.addControl(boxContainer);
  
    var aboutText = new BABYLON.GUI.TextBlock();
    aboutText.text="Game over, you won! Thanks for playing this very simple shooting game as my portfolio built on JS + Babylon as WebGL Framework";
    aboutText.fontSize = 16;
  
    boxContainer.addControl(aboutText);
  }
}

function getTotalEnemiesAlive(){
  let count = 0;
  for(let i = 0; i<enemys.length; i++){
    if (!enemys[i]._isDisposed) count++;
  }
  return count;
}

function generateEnemyAmountText(){
  const enemyIndicatorContainer = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("enemyIndicator");
  var boxContainer =   new BABYLON.GUI.Rectangle();
  boxContainer.name = "triggercontainer";
  boxContainer.width = '150px';
  boxContainer.height = '50px';
  boxContainer.cornerRadius = 5;
  boxContainer.color = "#67A0D1";
  boxContainer.thickness =  2;
  boxContainer.background = "#333333";
  boxContainer.top = "-40%";
  boxContainer.left= "-45%";
  enemyIndicatorContainer.addControl(boxContainer);
  var aboutText = new BABYLON.GUI.TextBlock();

  aboutText.text="Total enemies alive: " + getTotalEnemiesAlive();
  aboutText.fontSize = 12;


  boxContainer.addControl(aboutText);
}

