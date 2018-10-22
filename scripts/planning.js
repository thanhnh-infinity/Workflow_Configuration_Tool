/**
 * Author : Thanh Nguyen
 * Doc : Service composition framework - Workflow Description Tool
 * Date : 25-Feb-2017
 **/
function launchRecoveryProcess(){
  var initial_state_data = {}
  var goal_state_data = {}

  /* Step 1  : Read data from initial_state_data */
  initial_state_data = GLOBAL_INITIAL_STATE_ONTOLOGY_FOR_PLANNING_PURPOSE
  goal_state_data =   GLOBAL_GOAL_STATE_ONTOLOGY_FOR_PLANNING_PURPOSE
  original_plan = GLOBAL_WORKFLOW_PLAN_DATA_PLANNING.workflow_plan[0].raw_plan
  failed_service = JSON.parse(window.localStorage.getItem("FAILED_SERVICE_INFO"))

  if (isEmpty(initial_state_data) || jQuery.isEmptyObject(initial_state_data)){
     $.msgBox({
        title:"Warning",
        content:"Please define Initial State"
        //type:"error"
     }); 
    return;
  }
  input_array_object = []
  for(var i = 0 ; i < initial_state_data.components.length ; i++){
    input_object = {}
    input_object.name = initial_state_data.components[i].local_name
    input_object.resource_ontology_uri = initial_state_data.components[i].uri
    input_object.resource_ontology_id = initial_state_data.components[i].local_name
    input_object.resource_data_format_id = initial_state_data.components[i].data_format
    input_object.resource_data_format_uri = PREFIX_URI_ONTOLOGY + initial_state_data.components[i].data_format
    input_array_object.push(input_object)
  }

  if (isEmpty(goal_state_data) || jQuery.isEmptyObject(goal_state_data)){
     $.msgBox({
        title:"Warning",
        content:"Please define Initial State"
        //type:"error"
     }); 
    return;
  }
  output_array_object = []
  for(var i = 0 ; i < goal_state_data.components.length ; i++){
    output_object = {}
    output_object.name = goal_state_data.components[i].local_name
    output_object.resource_ontology_uri = goal_state_data.components[i].uri
    output_object.resource_ontology_id = goal_state_data.components[i].local_name
    output_object.resource_data_format_id = goal_state_data.components[i].data_format
    output_object.resource_data_format_uri = PREFIX_URI_ONTOLOGY + goal_state_data.components[i].data_format
    output_array_object.push(output_object)
  }

  if (isEmpty(original_plan) || jQuery.isEmptyObject(original_plan)){
     $.msgBox({
        title:"Warning",
        content:"Please define Initial State"
        //type:"error"
     }); 
    return;
  }

  if (isEmpty(failed_service) || jQuery.isEmptyObject(failed_service)){
    $.msgBox({
        title:"Warning",
        content:"No failed service is determined"
        //type:"error"
     }); 
    return;
  }

  /* Step 3 : Retrive Plan as JSON format from planning_ontology_server:8080 */
  request_data = { 
                   "request_parameters" : 
                   {
                      "input" : input_array_object,
                      "output" : output_array_object,
                      "failed_service" : [
                          {
                            "ID" : failed_service["service_name"],
                            "Index" : failed_service["service_index"]
                          }
                      ],
                      "original_workflow" : original_plan
                   },
                   "models" : {
                      "number" : 1,
                      "engine" : 1 //default 2
                   }
                 };
  string_request_data = JSON.stringify(request_data)
  document.getElementById("idLoading").style.display = "block";
  console.log("Start Recovery Process")
  $.ajax({
      type: "POST",
      method:"POST",
      url: RECOVERY_PROCESS_API_ROOT,
      data: string_request_data,
      //timeout: NLG_ENGINE_SERVER_TIME_OUT,
      contentType: "application/json; charset=utf-8",
      success: function (data) {
        if (isEmpty(data)){
          alert("We cannot find replaced workflow !")
          document.getElementById("idLoading").style.display = "none";
          return;
        } else {
          console.log(data)
          result_workflow = data
          GLOBAL_WORKFLOW_PLAN_DATA_PLANNING = result_workflow
          WORKFLOW_FOR_DESCRIPTION_NLG = result_workflow
          DisplayWorkflow_Graphic_From_Source(result_workflow)
          document.getElementById("idLoading").style.display = "none";  
          closeFailureDetection_Modal();

          $.msgBox({
              title:"Success",
              content:"A new workflow is generated to avoid failed service and re-use as much as possible executed services !"
              //type:"error"
           }); 
        }
        
      },
      error: function (textStatus, errorThrown) {
         if (textStatus.status = 200){
             alert(JSON.stringify(textStatus))
         } else {
             console.log("Error")
             alert(JSON.stringify(textStatus))
         }    
         document.getElementById("idLoading").style.display = "none";
      }
  }); 
}


function generate_WorkflowDescription_NLG(){
    /* Process for the case that Users still keep current workflow and have not clink composite and/or recomposite workflow */
    var wf_description =  JSON.parse(window.localStorage.getItem("NLG_WORKFLOW_DESCRIPTION"))
    console.log(wf_description)
    
    if (isEmpty(wf_description)){
        if (isEmpty(WORKFLOW_FOR_DESCRIPTION_NLG) 
            || jQuery.isEmptyObject(WORKFLOW_FOR_DESCRIPTION_NLG)){
            $.msgBox({
                title:"Warning",
                content:"There is no data sending"
                //type:"error"
             }); 
            return;
        } 
        console.log("Prepare data to send POST request to Portal Call-Back URL")
        console.log(WORKFLOW_FOR_DESCRIPTION_NLG)
        str_data = JSON.stringify(WORKFLOW_FOR_DESCRIPTION_NLG)

        //console.log(str_data)
        /*
        var call_back_portal_url = ""
        call_back_portal_url = window.localStorage.getItem("PORTAL_CALL_BACK_API_WORKFLOW_DATA");
        console.log(call_back_portal_url)

        if (isEmpty(call_back_portal_url)){
             $.msgBox({
                title:"Warning",
                content:"There is no Portal Call Back URL. Please contact with administrator"
                //type:"error"
             }); 
            return;
        }
        */


        document.getElementById("idLoading").style.display = "block";
        var call_back_portal_url = PORTAL_CALL_BACK_API_WORKFLOW_DATA
        //console.log(str_data)
        $.ajax({
            type: "POST",
            method:"POST",
            url: call_back_portal_url,
            data: str_data,
            timeout: NLG_ENGINE_SERVER_TIME_OUT,
            contentType: "application/json; charset=utf-8",
            success: function (data) {
               //console.log(data)
               //alert(JSON.stringify(data))
               window.localStorage.setItem("NLG_WORKFLOW_DESCRIPTION",JSON.stringify(data))
               document.getElementById("idLoading").style.display = "none";

               openDisplayWFDescripton_NLG_Modal();
            },
            error: function (textStatus, errorThrown) {
               if (textStatus.status = 200){
                   alert(JSON.stringify(textStatus))
                   //alert(textStatus)
               } else {
                   console.log("Error")
                   alert(JSON.stringify(textStatus))
                   //alert(textStatus)
               }
               /* Demo tam - xoa sau */
               //window.localStorage.setItem("NLG_WORKFLOW_DESCRIPTION",'{"data":"No data"}')
               //openDisplayWFDescripton_NLG_Modal();
               /***/
               document.getElementById("idLoading").style.display = "none";
            }
        });
    } else {
      openDisplayWFDescripton_NLG_Modal();
    }    
}

function recomposite_get_simWorkflow(){
  var initial_state_data = {}
  var goal_state_data = {}

  /* Step 1  : Read data from initial_state_data */
  initial_state_data = GLOBAL_INITIAL_STATE_ONTOLOGY_FOR_PLANNING_PURPOSE
  goal_state_data =   GLOBAL_GOAL_STATE_ONTOLOGY_FOR_PLANNING_PURPOSE
  inclusion_data = ADDED_OPERATION_NODES_LIST
  avoidance_data = AVOIDANCE_OPERATION_NODES_LIST

  if (isEmpty(RECOMPOSITE_ENGINE_ID) || RECOMPOSITE_ENGINE_ID == 0){
    RECOMPOSITE_ENGINE_ID = 2
  }

  /* Step 2 : Send POST METHOD API
     http://<planning_ontology_server:8080>/getPlanningWorkflow (Python + CherryPy)
     Input : Initial State, Goal State, Condition, etx
     Output: plan - workflow in JSON format
     POST METHOD with Initial State Data and Goal State Data - All Step about Create LP files and
     run planning are ON SERVER */
  console.log("Send API POST planning Engine Initial State :")
  console.log(initial_state_data)
  //Create input array object
  if (jQuery.isEmptyObject(initial_state_data) 
      || isEmpty(initial_state_data) 
      || (isEmpty(initial_state_data.components)) 
      || (initial_state_data.components.length <= 0)){
    //alert("No Initial State")

     $.msgBox({
      title:"Warning",
      content:"Please define Initial State"
      //type:"error"
     }); 
    return;
  }

  input_array_object = []
  for(var i = 0 ; i < initial_state_data.components.length ; i++){
    input_object = {}
    input_object.name = initial_state_data.components[i].local_name
    input_object.resource_ontology_uri = initial_state_data.components[i].uri
    input_object.resource_ontology_id = initial_state_data.components[i].local_name
    input_object.resource_data_format_id = initial_state_data.components[i].data_format
    input_object.resource_data_format_uri = PREFIX_URI_ONTOLOGY + initial_state_data.components[i].data_format
    input_array_object.push(input_object)
  }
  console.log("Send API POST planning Engine Goal State :")
  console.log(goal_state_data)

  if (jQuery.isEmptyObject(goal_state_data) 
      || isEmpty(goal_state_data) 
      || (isEmpty(goal_state_data.components)) 
      || (goal_state_data.components.length <= 0)){
    //alert("No Goal State")

     $.msgBox({
      title:"Warning",
      content:"Please define Goal State"
      //type:"error"
     }); 
    return;
  }
  output_array_object = []
  for(var i = 0 ; i < goal_state_data.components.length ; i++){
    output_object = {}
    output_object.name = goal_state_data.components[i].local_name
    output_object.resource_ontology_uri = goal_state_data.components[i].uri
    output_object.resource_ontology_id = goal_state_data.components[i].local_name
    output_object.resource_data_format_id = goal_state_data.components[i].data_format
    output_object.resource_data_format_uri = PREFIX_URI_ONTOLOGY + goal_state_data.components[i].data_format
    output_array_object.push(output_object)
  }

  /* Step 3 : Retrive Plan as JSON format from planning_ontology_server:8080 */
  request_data = { 
                   "request_parameters" : 
                   {
                      "input" : input_array_object,
                      "output" : output_array_object,
                      "avoidance" : avoidance_data,
                      "inclusion" : inclusion_data,
                      "insertion" : [],
                      "original_workflow" : GLOBAL_WORKFLOW_PLAN_DATA_PLANNING.workflow_plan[0].raw_plan,
                   },
                   "models" : {
                      "number" : 1,
                      "engine" : RECOMPOSITE_ENGINE_ID //default 2
                   }
                 };

  console.log(request_data)
  var result_workflow = {}
  string_request_data = JSON.stringify(request_data)
  console.log(string_request_data.length)
  document.getElementById("idLoading").style.display = "block";
  window.localStorage.removeItem("NLG_WORKFLOW_DESCRIPTION");
  
  $.ajax({
        method: "POST",
        url: RE_PLANNING_ENGINE_API_ROOT,
        dataType: "json",
        //async:false,
        //processData: false,
        data: string_request_data,
        contentType: "application/json; charset=utf-8",
        success: function (data) {
            if (isEmpty(data)){
              alert("No planning found")
              document.getElementById("idLoading").style.display = "none";
              return;
            }
            console.log(data)
            result_workflow = data
            WORKFLOW_FOR_DESCRIPTION_NLG = result_workflow
            DisplayWorkflow_Graphic_From_Source(result_workflow)
            document.getElementById("idLoading").style.display = "none";
        },
        error: function (textStatus, errorThrown) {
           if (textStatus.status = 200){
              
               console.log(textStatus)
               document.getElementById("idLoading").style.display = "none";
               result_workflow = textStatus
               WORKFLOW_FOR_DESCRIPTION_NLG = result_workflow

           } else {
               consol.log("sadasd")
               result_workflow = {}
               document.getElementById("idLoading").style.display = "none";
               return;
           }

           DisplayWorkflow_Graphic_From_Source(result_workflow)   
           document.getElementById("idLoading").style.display = "none";
        }

  });
}

function executePlanner_toGet_WorkFlow(){
  var initial_state_data = {}
  var goal_state_data = {}

  /* Step 1  : Read data from initial_state_data */
  initial_state_data = GLOBAL_INITIAL_STATE_ONTOLOGY_FOR_PLANNING_PURPOSE
  goal_state_data =   GLOBAL_GOAL_STATE_ONTOLOGY_FOR_PLANNING_PURPOSE
  inclusion_data = ADDED_OPERATION_NODES_LIST
  avoidance_data = AVOIDANCE_OPERATION_NODES_LIST

  if (isEmpty(PLANNING_ENGINE_ID) || PLANNING_ENGINE_ID == 0){
    PLANNING_ENGINE_ID = 2
  }

  /* Step 2 : Send POST METHOD API
     http:<planning_ontology_server:8080>/getPlanningWorkflow (Python + CherryPy)
     Input : Initial State, Goal State, Condition, etx
     Output: plan - workflow in JSON format
     POST METHOD with Initial State Data and Goal State Data - All Step about Create LP files and
     run planning are ON SERVER */
  console.log("Send API POST planning Engine Initial State :")
  console.log(initial_state_data)
  //Create input array object
  if (jQuery.isEmptyObject(initial_state_data) 
      || isEmpty(initial_state_data) 
      || (isEmpty(initial_state_data.components)) 
      || (initial_state_data.components.length <= 0)){
    //alert("No Initial State")

     $.msgBox({
      title:"Warning",
      content:"Please define Initial State"
      //type:"error"
     }); 

    return;
  }

  input_array_object = []
  for(var i = 0 ; i < initial_state_data.components.length ; i++){
    input_object = {}
    input_object.name = initial_state_data.components[i].local_name
    input_object.resource_ontology_uri = initial_state_data.components[i].uri
    input_object.resource_ontology_id = initial_state_data.components[i].local_name
    input_object.resource_data_format_id = initial_state_data.components[i].data_format
    input_object.resource_data_format_uri = PREFIX_URI_ONTOLOGY + initial_state_data.components[i].data_format
    input_array_object.push(input_object)
  }
  console.log("Send API POST planning Engine Goal State :")
  console.log(goal_state_data)

  if (jQuery.isEmptyObject(goal_state_data) 
      || isEmpty(goal_state_data) 
      || (isEmpty(goal_state_data.components)) 
      || (goal_state_data.components.length <= 0)){
    //alert("No Goal State")
    $.msgBox({
      title:"Warning",
      content:"Please define Goal State"
      //type:"error"
     }); 
    return;
  }
  output_array_object = []
  for(var i = 0 ; i < goal_state_data.components.length ; i++){
    output_object = {}
    output_object.name = goal_state_data.components[i].local_name
    output_object.resource_ontology_uri = goal_state_data.components[i].uri
    output_object.resource_ontology_id = goal_state_data.components[i].local_name
    output_object.resource_data_format_id = goal_state_data.components[i].data_format
    output_object.resource_data_format_uri = PREFIX_URI_ONTOLOGY + goal_state_data.components[i].data_format
    output_array_object.push(output_object)
  }
  /* Step 3 : Retrive Plan as JSON format from planning_ontology_server:8080 */
  request_data = { 
                   "request_parameters" : 
                   {
                      "input" : input_array_object,
                      "output" : output_array_object,
                      "avoidance" : avoidance_data,
                      "inclusion" : inclusion_data,
                      "insertion" : []
                   },
                   "models" : {
                      "number" : 1,
                      "engine" : PLANNING_ENGINE_ID //defaut 2
                   }
                 };

  console.log(request_data)
  var result_workflow = {}
  string_request_data = JSON.stringify(request_data)
  console.log(string_request_data.length)
  document.getElementById("idLoading").style.display = "block";
  window.localStorage.removeItem("NLG_WORKFLOW_DESCRIPTION");
  /* Simulate data - Read from file */
  //document.getElementById("idLoading").style.display = "none";
  //DisplayWorkflow_Graphic_From_Source(TEST_ABSTRACT_CONCRETE_WORKFLOW_PLAN_DATA)

  
  $.ajax({
        method: "POST",
        url: PLANNING_ENGINE_API_ROOT,
        dataType: "json",
        //async:false,
        //processData: false,
        data: string_request_data,
        contentType: "application/json; charset=utf-8",
        success: function (data) {
            if (isEmpty(data)){
              alert("No planning found")
              document.getElementById("idLoading").style.display = "none";
              return;
            }
            console.log(data)
            result_workflow = data
            GLOBAL_WORKFLOW_PLAN_DATA_PLANNING = result_workflow
            WORKFLOW_FOR_DESCRIPTION_NLG = result_workflow
            DisplayWorkflow_Graphic_From_Source(result_workflow)
            document.getElementById("idLoading").style.display = "none";
        },
        error: function (textStatus, errorThrown) {
           if (textStatus.status = 200){
              
               $.msgBox({
                title:"Error",
                content:"No plan is found",
                type:"error"
               }); 
               document.getElementById("idLoading").style.display = "none";
               return;

           } else {
               $.msgBox({
                title:"Error",
                content:"No plan is found",
                type:"error"
               }); 
               document.getElementById("idLoading").style.display = "none";
               return;
           }
           DisplayWorkflow_Graphic_From_Source(result_workflow)   
           document.getElementById("idLoading").style.display = "none";
        }

  });
  
}
