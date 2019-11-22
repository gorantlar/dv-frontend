var app = new Vue({
    el: '#app',
    methods:{
       init: function(){
            self = this
            for(i=this.start; i<= this.end; i++){
                self.svgReceived += 1 
                $.ajax({
                    url: this.url + "collection/order/" + i,
                    contentType: "application/json",
                    dataType: 'json',
                    success: function(result){
                        if(!result || result.length == 0){
                            console.log(i + " received empty response")
                            self.noResponseSvg += 1
                            return
                        }
                        
                        result = result[0]
                        //self.order = result.order
                        //console.log(result);
                        self.deconstruct(result);
                    },
                    failure: function(error){
                        console.log(i + " " + error)
                    }
                })
            }   
        
       },
       deconstruct: function(result){
            if(!result.svg){
                result.svg = '<svg width="460" height="400"><g transform="translate(40,10)"><text fill="#000" x="-9" dy="0.32em">3,000</text><text fill="#000" y="-9" dy="0.32em">3,000</text><rect x="1" transform="translate(312, 356.533203125)" width="18.5" height="3.466801824632512" style="fill: rgb(105, 179, 162);"></rect></svg>'
            }
            data = decon(result.svg)
            console.log(data);

            let marks = [];
            let xAxisType, yAxisType;
            let nodeName, tempNum
            data['unbound'].forEach(d => {
                nodeName = d.node.nodeName
                if(['rect', 'circle', 'path', 'polygon'].includes(nodeName) && !marks.includes(nodeName)){
                marks.push(nodeName)
                }
                if(nodeName == "text"){
                if((d.nodeAttrs.x == "0" || !d.nodeAttrs.x) && !xAxisType){
                    //parseFloat(yournumber.replace(/,/g, ''))
                    tempNum = d.node.textContent
                    tempNum = parseFloat(tempNum.replace(/,/g, ''))
                    if(Number.isNaN(tempNum)){
                    xAxisType = "nominal"
                    }else{
                    xAxisType = "quantitative"
                    }
                }

                if((d.nodeAttrs.y == "0"|| !d.nodeAttrs.y) && !yAxisType){
                    tempNum = d.node.textContent
                    tempNum = parseFloat(tempNum.replace(/,/g, ''))
                    if(Number.isNaN(tempNum)){
                    yAxisType = "nominal"
                    }else{
                    yAxisType = "quantitative"
                    }
                }
                }
            })

            let reqObj = {}
            reqObj.order = result.order
            reqObj.marks = marks
            reqObj.xAxisType = xAxisType
            reqObj.yAxisType = yAxisType

            this.sendDataToServer(reqObj)
       },
       sendDataToServer : function(data){
        console.log(data)
        this.svgProcessed += 1;
        $.ajax({
            type: "POST",
            url: this.url + "collection",
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'json',
            success: function(result){
                console.log("done")
            },
            failure: function(error){
                console.log(self.order + " " + error)
            }
        })
       }

    },
    data: {
        currentId: 0,
        errors: [],
        url:"http://127.0.0.1:3000/",
        order:0,
        start: 1,
        end: 1,
        svgReceived:0,
        svgProcessed:0,
        noResponseSvg:0
    }
  })
