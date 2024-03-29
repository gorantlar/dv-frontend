Vue.component('graphs-holder',{
    props:['code','id'],
    template: "<div class='sample-chart-holder' v-bind:id='id'><span>Order: {{id}}</span><button @click='deletesvg()'>Delete</button><div v-html='code'></div></div>"
})
var app = new Vue({
    el: '#app',
    methods:{
        fun(){
            this.message= this.message.split('').reverse().join('');
        },
        submit(){
            this.errors = []
            this.graphs = [];
            if(this.inputType == ''){
                this.errors.push('Please select the type of input')
            }

            if(this.userInput == ''){
                this.errors.push('Enter data')
            }else if(this.inputType == 'url' && !this.validateUrl(this.userInput)){
                this.errors.push('Please enter a valid URL')
            }else if(this.inputType == 'query' && !this.validateQuery(this.userInput)){
                this.errors.push('Please enter a valid Query')
            }else if(this.inputType == 'svg' && !this.validateSvg(this.userInput)){
                this.errors.push('Please enter a valid SVG')
            }

            if(this.errors.length > 0){
                return
            }else{
                this.query();
            }
            
        },
        query(){
            //this.graphs = graphs;
            if(this.inputType == "url"){
                this.getSvg(this.userInput)
            }else if(this.inputType == "query"){
                this.search(this.userInput)
            }else if(this.inputType == "svg"){
                this.processSvg(this.userInput)
            }
        },
        getSvg(){
            this.showProgress = true
            let self = this
            let data = {}
            data['url'] = this.userInput
            $.ajax({
                type: "POST",
                url: this.crawlerUrl + "svg",
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: 'json',
                success: function(result){
                    console.log("called crawler for getting the svg")
                    let op = "";
                    for(i=0;i<result.length;i++){
                        let e = result[i].element
                        if(op.length < e.length){
                            op = e
                        }

                    }
                    let deconJson = self.deconstruct(op)
                    if(deconJson.marks.length == 0){
                        self.showProgress = false;
                        return;
                    }
                    self.search(JSON.stringify(deconJson))

                },
                failure: function(error){
                    console.log(self.order + " " + error)
                }
            })
        },
        processSvg: function(svg){
            let deconJson = this.deconstruct(svg)
            this.search(JSON.stringify(deconJson))
        },
        search: function(input){
            this.showProgress = true
            input = input.replace(/'/g, '"');
            let json = JSON.parse(input)
            let self = this
            // json["from"] = 0
            // json["to"] = 300
            this.lastQuery = input
            const params = (new URLSearchParams(json)).toString()

            console.log(params.toString())

            $.ajax({
                url: this.url + "collection/limit/"+self.limit+"?" + params,
                contentType: "application/json",
                dataType: 'json',
                success: function(result){
                    result.forEach(e =>{
                        let t = e.svg.substring(0, 4)
                        e.svg = "<svg height='200px' width='400px' viewBox='0 0 200 400' preserveAspectRatio='xMinYMin meet'" + e.svg.substring(4)

                        e.url = e.url.replace('/raw','');
                    })
                    self.graphs = result;
                    self.showProgress = false
                    console.log(result);
                },
                failure: function(error){
                    console.log(i + " " + error)
                }
            })


        },
        deletesvg : function(order){
            $.ajax({
                type: "GET",
                url: this.url + "collection/delete/order/"+order,
                contentType: "application/json",
                dataType: 'json',
                success: function(result){
                    console.log("done")
                },
                failure: function(error){
                    console.log(error)
                }
            })
        },
        deconstruct: function(result){
            // if(!result.svg){
            //     result.svg = '<svg width="460" height="400"><g transform="translate(40,10)"><text fill="#000" x="-9" dy="0.32em">3,000</text><text fill="#000" y="-9" dy="0.32em">3,000</text><rect x="1" transform="translate(312, 356.533203125)" width="18.5" height="3.466801824632512" style="fill: rgb(105, 179, 162);"></rect></svg>'
            // }
            //var doc = new DOMParser().parseFromString(result.svg, "text/xml");
            //doc.firstChild.innerHTML
            data = decon(result)
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
            
            return reqObj
            
       },
        validateUrl(url){
            try {
                new URL(url);
                return true;
              } catch (_) {
                return false;  
              }
        },
        validateQuery(){
            return true
        },
        validateSvg(){
            return true
        }
    },
    data: {
        userInput:"",
        inputType:"",
        graphs: [],
        errors: [],
        crawlerUrl: "https://3ea3c9b0.ngrok.io/",
        url:"https://cse578-final-project.herokuapp.com/",
        lastQuery: {},
        limit: 10,
        showProgress: false
    }

  })

  var graphs = [
    {"key":3,"code":'<svg width="460" height="400"><g transform="translate(40,10)"><g transform="translate(0,360)" fill="none" font-size="10" font-family="sans-serif" text-anchor="middle"><path class="domain" stroke="#000" d="M0.5,6V0.5H390.5V6"></path><g class="tick" opacity="1" transform="translate(0.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">0</text></g><g class="tick" opacity="1" transform="translate(39.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">100</text></g><g class="tick" opacity="1" transform="translate(78.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">200</text></g><g class="tick" opacity="1" transform="translate(117.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">300</text></g><g class="tick" opacity="1" transform="translate(156.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">400</text></g><g class="tick" opacity="1" transform="translate(195.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">500</text></g><g class="tick" opacity="1" transform="translate(234.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">600</text></g><g class="tick" opacity="1" transform="translate(273.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">700</text></g><g class="tick" opacity="1" transform="translate(312.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">800</text></g><g class="tick" opacity="1" transform="translate(351.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">900</text></g><g class="tick" opacity="1" transform="translate(390.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">1,000</text></g></g><g fill="none" font-size="10" font-family="sans-serif" text-anchor="end"><path class="domain" stroke="#000" d="M-6,360.5H0.5V0.5H-6"></path><g class="tick" opacity="1" transform="translate(0,360.5)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">0</text></g><g class="tick" opacity="1" transform="translate(0,314.88418651799293)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">500</text></g><g class="tick" opacity="1" transform="translate(0,269.2683730359858)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,000</text></g><g class="tick" opacity="1" transform="translate(0,223.6525595539787)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,500</text></g><g class="tick" opacity="1" transform="translate(0,178.0367460719716)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">2,000</text></g><g class="tick" opacity="1" transform="translate(0,132.42093258996454)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">2,500</text></g><g class="tick" opacity="1" transform="translate(0,86.80511910795741)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">3,000</text></g><g class="tick" opacity="1" transform="translate(0,41.18930562595034)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">3,500</text></g></g><rect x="1" transform="translate(0, 281.8144836425781)" width="18.5" height="78.18550430816015" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(19.5, 0)" width="18.5" height="360" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(39, 143.5985870361328)" width="18.5" height="216.40141915864166" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(58.5, 280.7197265625)" width="18.5" height="79.28028383172835" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(78, 306.7207336425781)" width="18.5" height="53.27927014698429" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(97.5, 334.45513916015625)" width="18.5" height="25.544855549923966" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(117, 336.64471435546875)" width="18.5" height="23.35529650278761" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(136.5, 354.7998046875)" width="18.5" height="5.200202736948825" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(156, 346.406494140625)" width="18.5" height="13.593512417638124" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(175.5, 350.0557556152344)" width="18.5" height="9.944247339077549" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(195, 355.16473388671875)" width="18.50000000000003" height="4.835276229092756" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(214.5, 351.3330078125)" width="18.49999999999997" height="8.667004561581336" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(234, 356.806884765625)" width="18.5" height="3.1931069437404744" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(253.5, 355.8033447265625)" width="18.5" height="4.1966548403446495" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(273, 357.90167236328125)" width="18.5" height="2.0983274201723248" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(292.5, 358.8139953613281)" width="18.5" height="1.186011150532181" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(312, 356.533203125)" width="18.5" height="3.466801824632512" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(331.5, 358.540283203125)" width="18.5" height="1.4597060314242185" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(351, 357.9928894042969)" width="18.5" height="2.0070957932082933" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(370.5, 357.90167236328125)" width="18.5" height="2.0983274201723248" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(390, 360)" width="-1" height="0" style="fill: rgb(105, 179, 162);"></rect></g></svg>'},
    {"key":2, "code":'<svg width="460" height="400"><g transform="translate(40,10)"><g transform="translate(0,360)" fill="none" font-size="10" font-family="sans-serif" text-anchor="middle"><path class="domain" stroke="#000" d="M0.5,6V0.5H390.5V6"></path><g class="tick" opacity="1" transform="translate(0.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">0</text></g><g class="tick" opacity="1" transform="translate(39.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">100</text></g><g class="tick" opacity="1" transform="translate(78.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">200</text></g><g class="tick" opacity="1" transform="translate(117.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">300</text></g><g class="tick" opacity="1" transform="translate(156.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">400</text></g><g class="tick" opacity="1" transform="translate(195.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">500</text></g><g class="tick" opacity="1" transform="translate(234.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">600</text></g><g class="tick" opacity="1" transform="translate(273.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">700</text></g><g class="tick" opacity="1" transform="translate(312.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">800</text></g><g class="tick" opacity="1" transform="translate(351.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">900</text></g><g class="tick" opacity="1" transform="translate(390.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">1,000</text></g></g><g fill="none" font-size="10" font-family="sans-serif" text-anchor="end"><path class="domain" stroke="#000" d="M-6,360.5H0.5V0.5H-6"></path><g class="tick" opacity="1" transform="translate(0,360.5)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">0</text></g><g class="tick" opacity="1" transform="translate(0,318.66385822196395)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">200</text></g><g class="tick" opacity="1" transform="translate(0,276.82771644392795)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">400</text></g><g class="tick" opacity="1" transform="translate(0,234.9915746658919)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">600</text></g><g class="tick" opacity="1" transform="translate(0,193.15543288785588)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">800</text></g><g class="tick" opacity="1" transform="translate(0,151.3192911098199)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,000</text></g><g class="tick" opacity="1" transform="translate(0,109.48314933178384)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,200</text></g><g class="tick" opacity="1" transform="translate(0,67.64700755374781)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,400</text></g><g class="tick" opacity="1" transform="translate(0,25.81086577571176)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,600</text></g></g><rect x="1" transform="translate(0,356.6531086577571)" width="6.8" height="3.346891342242884" style="fill: orange;"></rect><rect x="1" transform="translate(7.8,295.5723416618245)" width="6.8" height="64.42765833817549" style="fill: orange;"></rect><rect x="1" transform="translate(15.6,68.82045322486925)" width="6.799999999999999" height="291.17954677513075" style="fill: orange;"></rect><rect x="1" transform="translate(23.4,74.25915165601396)" width="6.800000000000001" height="285.74084834398604" style="fill: orange;"></rect><rect x="1" transform="translate(31.2,0)" width="6.800000000000001" height="360" style="fill: orange;"></rect><rect x="1" transform="translate(39,69.44799535153982)" width="6.799999999999997" height="290.5520046484602" style="fill: orange;"></rect><rect x="1" transform="translate(46.8,208.13480534572923)" width="6.800000000000011" height="151.86519465427077" style="fill: orange;"></rect><rect x="1" transform="translate(54.60000000000001,286.1592097617664)" width="6.79999999999999" height="73.84079023823358" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(62.4,236.37420104590353)" width="6.800000000000004" height="123.62579895409647" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(70.2,321.9291109819872)" width="6.799999999999997" height="38.07088901801279" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(78,308.54154561301567)" width="6.799999999999997" height="51.45845438698433" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(85.8,301.6385822196397)" width="6.799999999999997" height="58.361417780360284" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(93.6,335.52585705984893)" width="6.800000000000011" height="24.47414294015107" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(101.4,346.4032539221383)" width="6.800000000000011" height="13.596746077861724" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(109.20000000000002,327.1586287042417)" width="6.799999999999983" height="32.84137129575828" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(117,349.95932597327135)" width="6.799999999999997" height="10.040674026728652" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(124.8,341.59209761766414)" width="6.800000000000026" height="18.407902382335863" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(132.60000000000002,332.5973271353864)" width="6.799999999999983" height="27.402672864613578" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(140.4,352.46949447995354)" width="6.799999999999983" height="7.530505520046461" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(148.2,357.9081929110982)" width="6.800000000000011" height="2.0918070889018168" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(156,338.45438698431144)" width="6.799999999999983" height="21.54561301568856" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(163.79999999999998,353.9337594421848)" width="6.800000000000011" height="6.066240557815206" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(171.6,345.5665310865776)" width="6.800000000000011" height="14.433468913422416" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(179.4,353.7245787332946)" width="6.799999999999983" height="6.2754212667053935" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(187.2,354.3521208599651)" width="6.800000000000011" height="5.647879140034888" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(195,351.6327716443928)" width="6.800000000000011" height="8.36722835560721" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(202.8,358.53573503776875)" width="6.800000000000011" height="1.4642649622312547" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(210.60000000000002,357.699012202208)" width="6.800000000000011" height="2.300987797792004" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(218.40000000000003,342.4288204532249)" width="6.7999999999999545" height="17.571179546775113" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(226.2,358.74491574665893)" width="6.800000000000011" height="1.2550842533410673" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(234,357.9081929110982)" width="6.800000000000011" height="2.0918070889018168" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(241.8,355.39802440441605)" width="6.799999999999983" height="4.601975595583951" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(249.6,358.32655432887856)" width="6.80000000000004" height="1.673445671121442" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(257.40000000000003,358.74491574665893)" width="6.800000000000011" height="1.2550842533410673" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(265.20000000000005,352.67867518884367)" width="6.7999999999999545" height="7.32132481115633" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(273,359.37245787332944)" width="6.800000000000011" height="0.6275421266705621" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(280.8,359.1632771644393)" width="6.800000000000011" height="0.8367228355606926" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(288.6,356.23474723997674)" width="6.7999999999999545" height="3.765252760023259" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(296.4,359.1632771644393)" width="6.800000000000011" height="0.8367228355606926" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(304.2,358.53573503776875)" width="6.800000000000011" height="1.4642649622312547" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(312,354.3521208599651)" width="6.7999999999999545" height="5.647879140034888" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(319.79999999999995,357.699012202208)" width="6.800000000000011" height="2.300987797792004" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(327.59999999999997,359.5816385822196)" width="6.800000000000011" height="0.4183614177803747" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(335.4,357.0714700755375)" width="6.800000000000011" height="2.9285299244625094" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(343.2,360)" width="6.800000000000011" height="0" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(351,358.53573503776875)" width="6.800000000000011" height="1.4642649622312547" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(358.8,357.0714700755375)" width="6.7999999999999545" height="2.9285299244625094" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(366.59999999999997,359.1632771644393)" width="6.800000000000011" height="0.8367228355606926" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(374.4,357.48983149331787)" width="6.800000000000011" height="2.5101685066821346" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(382.2,358.32655432887856)" width="6.800000000000011" height="1.673445671121442" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(390,360)" width="-1" height="0" style="fill: rgb(105, 179, 162);"></rect><line x1="54.60000000000001" x2="54.60000000000001" y1="360" y2="25.31086577571176" stroke="grey" stroke-dasharray="4"></line><text x="74.1" y="67.14700755374781" style="font-size: 15px;">threshold: 140</text></g></svg>'},
    {"key":1, "code":'<svg width="460" height="400"><g transform="translate(40,10)"><g transform="translate(0,360)" fill="none" font-size="10" font-family="sans-serif" text-anchor="middle"><path class="domain" stroke="#000" d="M0.5,6V0.5H390.5V6"></path><g class="tick" opacity="1" transform="translate(0.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">0</text></g><g class="tick" opacity="1" transform="translate(39.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">100</text></g><g class="tick" opacity="1" transform="translate(78.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">200</text></g><g class="tick" opacity="1" transform="translate(117.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">300</text></g><g class="tick" opacity="1" transform="translate(156.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">400</text></g><g class="tick" opacity="1" transform="translate(195.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">500</text></g><g class="tick" opacity="1" transform="translate(234.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">600</text></g><g class="tick" opacity="1" transform="translate(273.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">700</text></g><g class="tick" opacity="1" transform="translate(312.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">800</text></g><g class="tick" opacity="1" transform="translate(351.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">900</text></g><g class="tick" opacity="1" transform="translate(390.5,0)"><line stroke="#000" y2="6"></line><text fill="#000" y="9" dy="0.71em">1,000</text></g></g><g fill="none" font-size="10" font-family="sans-serif" text-anchor="end"><path class="domain" stroke="#000" d="M-6,360.5H0.5V0.5H-6"></path><g class="tick" opacity="1" transform="translate(0,360.5)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">0</text></g><g class="tick" opacity="1" transform="translate(0,318.66385822196395)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">200</text></g><g class="tick" opacity="1" transform="translate(0,276.82771644392795)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">400</text></g><g class="tick" opacity="1" transform="translate(0,234.9915746658919)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">600</text></g><g class="tick" opacity="1" transform="translate(0,193.15543288785588)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">800</text></g><g class="tick" opacity="1" transform="translate(0,151.3192911098199)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,000</text></g><g class="tick" opacity="1" transform="translate(0,109.48314933178384)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,200</text></g><g class="tick" opacity="1" transform="translate(0,67.64700755374781)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,400</text></g><g class="tick" opacity="1" transform="translate(0,25.81086577571176)"><line stroke="#000" x2="-6"></line><text fill="#000" x="-9" dy="0.32em">1,600</text></g></g><rect x="1" transform="translate(0,356.6531086577571)" width="6.8" height="3.346891342242884" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(7.8,295.5723416618245)" width="6.8" height="64.42765833817549" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(15.6,68.82045322486925)" width="6.799999999999999" height="291.17954677513075" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(23.4,74.25915165601396)" width="6.800000000000001" height="285.74084834398604" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(31.2,0)" width="6.800000000000001" height="360" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(39,69.44799535153982)" width="6.799999999999997" height="290.5520046484602" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(46.8,208.13480534572923)" width="6.800000000000011" height="151.86519465427077" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(54.60000000000001,286.1592097617664)" width="6.79999999999999" height="73.84079023823358" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(62.4,236.37420104590353)" width="6.800000000000004" height="123.62579895409647" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(70.2,321.9291109819872)" width="6.799999999999997" height="38.07088901801279" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(78,308.54154561301567)" width="6.799999999999997" height="51.45845438698433" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(85.8,301.6385822196397)" width="6.799999999999997" height="58.361417780360284" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(93.6,335.52585705984893)" width="6.800000000000011" height="24.47414294015107" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(101.4,346.4032539221383)" width="6.800000000000011" height="13.596746077861724" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(109.20000000000002,327.1586287042417)" width="6.799999999999983" height="32.84137129575828" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(117,349.95932597327135)" width="6.799999999999997" height="10.040674026728652" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(124.8,341.59209761766414)" width="6.800000000000026" height="18.407902382335863" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(132.60000000000002,332.5973271353864)" width="6.799999999999983" height="27.402672864613578" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(140.4,352.46949447995354)" width="6.799999999999983" height="7.530505520046461" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(148.2,357.9081929110982)" width="6.800000000000011" height="2.0918070889018168" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(156,338.45438698431144)" width="6.799999999999983" height="21.54561301568856" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(163.79999999999998,353.9337594421848)" width="6.800000000000011" height="6.066240557815206" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(171.6,345.5665310865776)" width="6.800000000000011" height="14.433468913422416" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(179.4,353.7245787332946)" width="6.799999999999983" height="6.2754212667053935" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(187.2,354.3521208599651)" width="6.800000000000011" height="5.647879140034888" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(195,351.6327716443928)" width="6.800000000000011" height="8.36722835560721" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(202.8,358.53573503776875)" width="6.800000000000011" height="1.4642649622312547" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(210.60000000000002,357.699012202208)" width="6.800000000000011" height="2.300987797792004" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(218.40000000000003,342.4288204532249)" width="6.7999999999999545" height="17.571179546775113" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(226.2,358.74491574665893)" width="6.800000000000011" height="1.2550842533410673" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(234,357.9081929110982)" width="6.800000000000011" height="2.0918070889018168" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(241.8,355.39802440441605)" width="6.799999999999983" height="4.601975595583951" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(249.6,358.32655432887856)" width="6.80000000000004" height="1.673445671121442" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(257.40000000000003,358.74491574665893)" width="6.800000000000011" height="1.2550842533410673" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(265.20000000000005,352.67867518884367)" width="6.7999999999999545" height="7.32132481115633" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(273,359.37245787332944)" width="6.800000000000011" height="0.6275421266705621" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(280.8,359.1632771644393)" width="6.800000000000011" height="0.8367228355606926" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(288.6,356.23474723997674)" width="6.7999999999999545" height="3.765252760023259" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(296.4,359.1632771644393)" width="6.800000000000011" height="0.8367228355606926" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(304.2,358.53573503776875)" width="6.800000000000011" height="1.4642649622312547" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(312,354.3521208599651)" width="6.7999999999999545" height="5.647879140034888" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(319.79999999999995,357.699012202208)" width="6.800000000000011" height="2.300987797792004" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(327.59999999999997,359.5816385822196)" width="6.800000000000011" height="0.4183614177803747" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(335.4,357.0714700755375)" width="6.800000000000011" height="2.9285299244625094" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(343.2,360)" width="6.800000000000011" height="0" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(351,358.53573503776875)" width="6.800000000000011" height="1.4642649622312547" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(358.8,357.0714700755375)" width="6.7999999999999545" height="2.9285299244625094" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(366.59999999999997,359.1632771644393)" width="6.800000000000011" height="0.8367228355606926" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(374.4,357.48983149331787)" width="6.800000000000011" height="2.5101685066821346" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(382.2,358.32655432887856)" width="6.800000000000011" height="1.673445671121442" style="fill: rgb(105, 179, 162);"></rect><rect x="1" transform="translate(390,360)" width="-1" height="0" style="fill: rgb(105, 179, 162);"></rect></g></svg>'}
]