var spanner = function(google){

    var r = {},
    $,
    glow,
    google,
    gcal,
    query,
    lifespanUrl,
    allFeedsUrl = "http://www.google.com/calendar/feeds/default/owncalendars/full",
    g,
    scale = 1,
    spans = {},
    actionListener;

    // =================================================================
    // a span
    var Span = function(id, label, type, start, end){


        this.id = id;
        this.spanLabel = label;
        this.spanType = type;

        this.max = parseInt($("#events").css("width"));

        var now = new Date(); // this is actually the event horizon... it could be DOB + 100 or similar
        if(!end){ end = now; }  

        this.startDate = new Date(start);
        this.endDate = new Date(end);

        nowTime = now.getTime() / (1000 * 60 * 60 * 24);

        this.startTime = this.startDate.getTime() / (1000 * 60 * 60 * 24);
        this.endTime = this.endDate.getTime() / (1000 * 60 * 60 * 24);

        this.startLabel = this.startDate.getDate() + "-" + (this.startDate.getMonth()+1) + "-" + this.startDate.getFullYear();
        this.endLabel = this.endDate.getDate() + "-" + (this.endDate.getMonth()+1) + "-" + this.endDate.getFullYear();

        if(this.endTime > nowTime){
            this.state = "ongoing";
            this.endTime = nowTime;
            this.endLabel = "Now";
        } else {
            this.state = "completed";
        }

        this.spanOffset = nowTime - this.endTime;
        this.spanLength = this.endTime - this.startTime;
        this.maxSpanLength = this.spanLength;

        newscale = this.max/this.maxSpanLength;
        if(newscale < scale){ scale = newscale; }

        this.spanWidth = this.spanLength * scale;
        this.spanOffsetWidth = this.spanOffset * scale;

        this.create();
        this.adjust();
    };


    // =================================================================
    Span.prototype.adjust = function(){
        $("#" + this.id).css("width", this.spanWidth);
        $("#" + this.id).css("margin-right", this.spanOffsetWidth);
    };

    // =================================================================
    Span.prototype.create = function(google){

        var that = this;

        this.item = g.dom.create(''+
        '<li>'+
        '<span class="event '+ this.state + ' ' + this.spanType + '" id="' + this.id + '">'+
        ' <span class="start">'+
        '  <span class="tip">' + this.startLabel + '<span></span></span>'+
        ' </span>'+
        ' <span class="label">' + this.spanLabel + '</span>'+
        ' <span class="end">'+
        '  <span class="tip">' + this.endLabel + '<span></span></span>'+
        ' </span>'+
        '</span>'+
        '<//li>');

        $("#events").append(this.item);

    };

    // =================================================================
    r.setupService = function(google) {
        gcal = new google.gdata.calendar.CalendarService('spanner');

        this.checkLogin(google);        
    };

    // =================================================================
    r.setupUI = function(google) {

        $("#utils").append('<a class="button negative" id="logout">Log out</a>');

        bind(
            "#logout",
            "click",
            function (e) {
                that.logMeOut(google);
            }
        );

    };


    // =================================================================
    r.checkLogin = function(google) {
        var that = this;

        scope = "http://www.google.com/calendar/feeds/";

        if (google.accounts.user.checkLogin(scope)) {

            // =================================================================
            // move this to a 'fire up UI' method...

            that.checkCalendars(google);

            // =================================================================
            $("#utils").append('<a class="button negative" id="logout">Log out</a>');
            bind(
                "#logout",
                "click",
                function (e) {
                    that.logMeOut(google);
                }
            );

            // =================================================================
            $("#actions").append('<a class="button positive" id="add">Add</a><form action="#" id="addbox" class="off"><input class="submit" type="submit" value="Add" /></div>');

            $("#addbox").append('<span class="in"><label for="newSpanLabel">Label <span>make it unique</span></span></label><input type="text" id="newSpanLabel" /></span>');
            $("#addbox").append('<span class="in"><label for="newSpanStart">Start <span>e.g. 1 Jan 1984</span></label><input type="text" id="newSpanStart" /></span>');
            $("#addbox").append('<span class="in"><label for="newSpanEnd">End <span>you guessed it</span></label><input type="text" id="newSpanEnd" /></span>');
            
            $("#addbox").append('<span class="in"><label for="newSpanType">Type <span>(experimental)</span></label>'+
                                '<select id="newSpanType">'+
                                    '<option value="life">Life</option>'+
                                    '<option value="education">Education</option>'+
                                    '<option value="job">Job</option>'+
                                    '<option value="relationship">Relationship</option>'+
                                    '<option value="location">Location</option>'+
                                    '<option value="thing">Thing</option>'+
                                '</select></span>');

            bind(
                "#add",
                "click",
                function (e) {
                    $("#addbox").addClass("on");
                    $("#messages").html("<p>Enter the details of a span...</p>");

                    bind(
                        "#addbox",
                        "submit",
                        function (e) {
                            e.preventDefault();
                            
                            var spanLabel = $("#newSpanLabel").val();
                            var spanType = $("#newSpanType").val();

                            var startRawDate = $("#newSpanStart").val();
                            var endRawDate = $("#newSpanEnd").val();

                            if( (spanLabel != "") && (startRawDate != "") && (endRawDate != "") ){

                                var startJSDate = new Date(startRawDate);
                                var endJSDate = new Date(endRawDate);

                                that.addSpan(google, spanLabel, spanType, startJSDate, endJSDate);                        
                               console.log(spanLabel+" "+startJSDate+" "+endJSDate);
                            } else{
                                $("#messages").html("<p>You left some bits out...</p>");
                            }
                        }
                    );

                }
            );

            // =================================================================
            //$("#actions").append('<a class="button positive" id="refresh">Refresh</a>');
            //bind(
                //    "#refresh",
                //    "click",
                //    function (e) {
                    //        that.getSpans(google);
                    //    }
                    //);

                    // =================================================================
                    $("#actions").append('<a class="button negative" id="deleter">Delete</a>');

                    var del = bind(
                        "#deleter",
                        "click",
                        function (e) {
                            $("#messages").html('<p>Click on the span you want to delete. (Or <a href="#" id="delcancel">don\'t bother</a></a>)</p>');
                        
                            $(this).addClass("active");
                            that.deleteSpans(google);
                            
                            bind(
                                "#delcancel",
                                "click",
                                function (e) {
                                    e.preventDefault();
                                    g.events.removeListener(actionListener);
                                    $("#deleter").removeClass("active");
                                    $("#messages").html('<p>OK.</p>');
                                }
                            );
                                                        
                        }
                    );


                } else {

                    $("#utils").append('<a class="button positive" href="#" id="connect">Connect to your Google account</a>');
                    bind(
                        "#connect",
                        "click",
                        function (e) {
                            that.logMeIn(google);
                        }
                    );
                }
            };

            // =================================================================
            r.logMeIn  = function(google) {
                scope = "http://www.google.com/calendar/feeds/";
                var token = google.accounts.user.login(scope);
            };

            // =================================================================
            r.logMeOut = function(google) {
                google.accounts.user.logout();
                window.location.reload();
            };

            // =================================================================
            r.handleError = function(e) {
                alert("There was an error!");
                alert(e.cause ? e.cause.statusText : e.message);
            };

            // =================================================================
            r.checkCalendars = function(google){

                var that = this;

                var callback = function(result) {

                    var entries = result.feed.entry;
                    var gotCalendar = false;

                    for (var i = 0; i < entries.length; i++) {
                        var calendarEntry = entries[i];
                        var calendarTitle = calendarEntry.getTitle().getText();

                        if(calendarTitle == "Lifespan"){
                            gotCalendar = calendarEntry;
                        }
                    }

                    if(!gotCalendar){

                        that.makeCalendar(google);

                    } else {

                        lifespanUrl = gotCalendar.getLink().getHref();
                        that.getSpans(google);

                    }
                }

                gcal.getAllCalendarsFeed(allFeedsUrl, callback, this.handleError);

            };

            // =================================================================
            r.makeCalendar = function(google){

                var that = this;

                var entry = new google.gdata.calendar.CalendarEntry();
                entry.setTitle(google.gdata.Text.create('Lifespan'));

                var summary = new google.gdata.Text();
                summary.setText('The Lifespan Prototype...');
                entry.setSummary(summary);

                // Set the calendar to be visible in the Google Calendar UI
                var hidden = new google.gdata.calendar.HiddenProperty();
                hidden.setValue(false);
                entry.setHidden(hidden);
                var color = new google.gdata.calendar.ColorProperty();
                color.setValue('#2952A3');
                entry.setColor(color);

                var callback = function(result) {      
                    $("#messages").html("<p>The Lifespan calendar was successfully created.</p>");
                    that.checkCalendars(google);
                }

                var error = function(e) {      
                    $("#messages").html("<p>Hmmm. The Lifespan calendar couldn't be created.</p>");
                }

                gcal.insertEntry(allFeedsUrl, entry, callback, error, google.gdata.calendar.CalendarEntry);
            };

            // =================================================================
            r.getSpans = function(google){
                $("#messages").html("<p>Getting stuff...</p>");

                var query = new google.gdata.calendar.CalendarEventQuery(lifespanUrl);
                query.setMaxResults("500");
                query.setSortOrder("ascending");
                query.setParam("orderby","starttime");
                gcal.getEventsFeed(query, this.drawSpans, this.handleError);
            };

            // =================================================================
            r.addSpan = function( google, spanLabel, spanType, startDate, endDate ){

                $("#messages").html("<p>Adding the new span...</p>");

                var that = this;

                var entry = new google.gdata.calendar.CalendarEventEntry();
                entry.setTitle( google.gdata.Text.create( spanLabel ) );

                var when = new google.gdata.When();

                // this is dodgy, but it works...
                var st = google.gdata.DateTime.toIso8601( startDate );
                var et = google.gdata.DateTime.toIso8601( endDate );

                var startTime = google.gdata.DateTime.fromIso8601( st );
                var endTime = google.gdata.DateTime.fromIso8601( et );

                //console.log( spanLabel + " = " + startTime + " = " + endTime );

                when.setStartTime(startTime);
                when.setEndTime(endTime);
                entry.addTime(when);

                var extendedProp = new google.gdata.ExtendedProperty();
                extendedProp.setName('spanType');
                extendedProp.setValue( spanType );
                entry.addExtendedProperty(extendedProp);

                var callback = function(result) {
                    //console.log('event created!');
                    that.getSpans(google);

                    $("#newSpanLabel").val("");
                    $("#newSpanStart").val("");
                    $("#newSpanEnd").val("");
                }

                var error = function(e) {      
                    $("#messages").html("<p>Hmmm. Had trouble adding that new span. Try again?</p>");
                }

                gcal.insertEntry(lifespanUrl, entry, callback, error, google.gdata.calendar.CalendarEventEntry);
            };

            // =================================================================
            r.deleteSpans = function(google, searchText){

                var that = this;

                actionListener = bind(".event",
                "click",
                function (e) {
                    var spanLabel = $($(this).get(".label")[0]).text();
                    //alert(spanLabel);
                    $(this).css("opacity", "0.5");
                    that.deleteSpan( google, spanLabel );

                    $("#deleter").removeClass("active");
                });

            };

            // =================================================================
            r.deleteSpan = function(google, searchText){
                $("#messages").html('<p>Deleting... ' + searchText +'</p>');

                var that = this;

                var query = new google.gdata.calendar.CalendarEventQuery(lifespanUrl);

                query.setFullTextQuery(searchText);
                var callback = function(result) {
                    var entries = result.feed.entry;
                    if (entries.length == 1) { // found exactly one match
                        var event = entries[0];
                        event.deleteEntry(
                            function(result) {
                                // refresh all spans
                                $("#messages").html("<p>OK, deleted that.</p>");

                                that.getSpans(google);
                            }, 
                            this.handleError);

                        } else {
                            $("#messages").html("<p>Hmmm. Bit of a problem deleting that one.</p>");
                        }
                    }

                    gcal.getEventsFeed(query, callback, this.handleError);
                };

                // =================================================================
                r.drawSpans  = function(feedRoot) {
                    $("#events").html("");

                    $("#messages").html("<p>Got things.</p>");

                    var entries = feedRoot.feed.entry;

                    if (entries.length > 0) {

                        for (var i = 0; i < entries.length; i++) {
                            var calendarEntry = entries[i];
                            
                            //console.log(calendarEntry);
                            
                            var spanLabel = calendarEntry.getTitle().getText();
                            
                            var props = calendarEntry.getExtendedProperties();
                            
                            var spanType = "normal";
                            
                            for (var x = 0; x < props.length; x++) {
                                if(props[x].getName() == "spanType"){
                                    var spanType = props[x].getValue();
                                }
                            }
                            
                            var times = calendarEntry.getTimes();

                            if (times.length > 0) {
                                startDateTime = times[0].getStartTime();
                                startJSDate = startDateTime.getDate();

                                endDateTime = times[0].getEndTime();
                                endJSDate = endDateTime.getDate();
                            }

                            //console.log('Calendar title = ' + spanLabel.replace(" ", "_") );
                            //console.log('Calendar dates = ' + startJSDate + " - " + endJSDate);

                            var spanid = spanLabel.replace(" ", "_");

                            spans[spanid] = new Span(spanid, spanLabel, spanType, startJSDate, endJSDate );

                            // this is a bit hacky...

                            if(i == entries.length - 1){
                                $("#messages").html("There you go.");

                                bind("#events li",
                                "mouseenter",
                                function (e) {
                                    $(this).addClass("over");
                                });

                                bind("#events li",
                                "mouseleave",
                                function (e) {
                                    $(this).removeClass("over");
                                });

                            }
                        }

                    } else {
                        // No match is found for the full text query
                        //console.log('no events are matched from the query!');
                        $("#messages").html("<p>You need to create some spans. Start by entering your date of birth, and a far-future end time ;-)");
                    }
                };


                // =================================================================
                // set up our shortcuts
                // set up the basic DOM
                // fire up google calendar API

                r.init = function(glow, google){
                    g = glow;
                    $ = g.dom.get;
                    bind = g.events.addListener;

                    var set = g.dom.create('<ul id="events"></ul>');
                    $("body").append(set);

                    // we need to stop passing google around... :-/
                    this.setupService(google);

                };
                // =================================================================

                return r;
                }();


                // =================================================================
                // =================================================================
                // check for google JS, and if it's there, continue...

                if (typeof google == 'undefined') {  

                    alert("sorry, we need access to Google...");

                } else {

                    google.load("gdata", "1");
                    google.setOnLoadCallback(kickoff);
                }

                // =================================================================
                // we have google, we now want to wait for glow
                // and then we'll fire the init method

                function kickoff() {

                    glow.ready(
                        function(){
                            spanner.init(glow, google);
                        }
                    );
                };

                // =================================================================
                function oc(a)
                {
                    var o = {};
                    for(var i=0;i<a.length;i++)
                    {
                        o[a[i]]='';
                    }
                    return o;
                }
