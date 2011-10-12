(function(w) {
	
	 var r = function(options) {
	
		if( options == null && options.holder == null){
			throw "No holder specified.";
		}
	
		var settings = {
			holder     : options.holder,
			width      : (options.width || 450),
			height 	   : (options.height || 450),
			r 	   	   :  options.raphael ,
			collection : (options.collection || []),
			attrs	   : (options.attr || {
				fill: '#fff', 
				stroke: '#fff', 
				"fill-opacity": 0, 
				"stroke-width": 1
			})
		};
		
		this.afterAssociate = function(cb) {
			settings.afterAssociate = cb;
		};
		
		this.paper = settings.r;
  
		var init = function() {
			settings.r = settings.r || new Raphael(settings.holder, settings.width, settings.height);
		};		
	
		/**
		 *  Pass the element that you want to create with cordenates x, y, coreespond
		 *  If you want to create a new Rect, pass the name of element in the first param 
		 *
		 *  rAssociation.include('rect', 100, 90, 80, 60 );
		 *  
		 *  If you want a circle, just 
		 *  
		 *  rAssociation.include('circle', 100, 200, 40);
		 * 
		 *  to see which params correspond to you object see 
		 *  http://raphaeljs.com/reference.html
		 * 
		 **/
		this.include = function(svg) {
			var args 	= Array.prototype.slice.call(arguments, 1),
				element = settings.r[svg].apply(settings.r, args);
			
			element.attr(settings.attrs);
			defaultEvents(element);
			return element;
		};
	
		/**
		 * Pass the event and the element that you want attach some calback, the first argument is the
		 * event that you want to attach the callback or callbacks. 
		 * 
		 * Simple usage. 
		 * rAssociation.append('click', element, function(){ alert('this is a callback')});
		 * 
	     * See http://raphaeljs.com/reference.html#events to all events available.
		 * 
		 */
		this.append = function(event, collection) {

			var args =  Array.prototype.slice.call(arguments, 2);
			if( collection instanceof Array) {
				for (var i = 0; i < collection.length; i++) {
			        collection[i][event].apply(collection[i], args);
			    };
			}else{
				collection[event].apply(collection, args);
			}
		};
	
		// private methods
		var stageWork = {
			source :  null, 
			target : null
		};

		var self = this,
		    defaultEvents = function(element) {
		
			var el = (element || settings.collection);
		
			self.append('drag', el, move, dragger, drop);
			self.append('hover', el, on, down);
		};	
	
		var exists = function(target, source, reverse) {
				for (var i = settings.collection.length - 1; i >= 0; i--){
					if(settings.collection[i].from == target && settings.collection[i].to == source){
						return true;
					} else if(reverse){
						if(settings.collection[i].from === source && settings.collection[i].to == target){					
							return true;
						}
					}
				};
				return false;
			},
	
			// Default behavior  to drag'n'drop 
	     	dragger = function () {
	
				stageWork.source = this;
				
				var x = extractPostion(this.getBBox()).x;
				var y = extractPostion(this.getBBox()).y;
				
				this.animate({"fill-opacity": .2}, 100);			

				var path = ['M',x, y,'L', x, y].join(',');
				this.path = this.paper.path(path).attr(settings.attrs);
				
				this.ox = x;
				this.oy = y;				
	
	   	   },

	       move = function (dx, dy) {
				
				repath(this.path, this.ox + dx, this.oy + dy);
		        settings.r.safari();
	       },

	       drop = function () {

				this.animate({"fill-opacity": 0}, 100);
				this.path.remove();
	
				if(stageWork.target != null && stageWork.target != stageWork.source){
					if(! exists(stageWork.target, stageWork.source, true)){
						settings.collection.push(association(this, stageWork.target, '#fff'));
						if(settings.afterAssociate){
							settings.afterAssociate.call(this, stageWork.source, stageWork.target);					
						}
					}
				}
		
				stageWork.source = null;
	       },

		   on = function() {
		
			   	this.animate({"fill-opacity": .4}, 100);

				if (stageWork.source == null ) {
					stageWork.source = this;
				}else if (stageWork.source !== this){
					stageWork.target = this;
				}

		   },
	
		   down = function() {
				this.animate({"fill-opacity": 0}, 100);
				stageWork.target = null;
		   };
	
	
	
		var repath = function(path, x, y) {
			var cordenates = path.attrs.path[0];
			path.attr({path : ['M', cordenates[1], cordenates[2] , 'L', x, y ].join(',')});
		};
	
	
		//Associate the elements with a path line 
		var association = function(source, target) {

			var line; 

			//In case of redraw line path, just pass the object returned by this function
			if (source.path && source.from && source.to) {
		        line = source;
		        source = line.from;
		        target = line.to;
		    };

			var box1 = source.getBBox(),
		        box2 = target.getBBox();

			var fromX = extractPostion(box1).x,
			 	fromY = extractPostion(box1).y
				toX   = extractPostion(box2).x,
				toY   = extractPostion(box2).y;

			var path = ["M", fromX, fromY, "L", toX, toY].join(',');

			if (line && line.path) {
		        line.path.attr({path: path});
		    } else {
		        return {
		            path: settings.r.path(path).attr({'stroke-dasharray': 10, stroke : '#000'}),
		            from: source,
		            to: target
		        };
		    }
		};
		
		var extractPostion = function(box) {
			return {
				x : box.x + (box.width / 2 ),
				y : box.y + (box.height / 2 )
			}
		};
		
		init();
	};

	r.prototype.scale = {
	
		linear : function() {
		
			var domain = [0,1],
				range  = [0,0],
				base   = [];
		
			function scale(x){
				return base[domain.indexOf(x)];
			};
		
		 	function rescale() {
				var scability = interpolate();
				
				base = [];
				base.push(range[0]);
				
				for (var i=0; i < domain.length; i++) {
					base.push(base[i] + scability);
				};		

				return scale;
			};
	
			scale.domain = function(x) {
				if(! arguments.length ) return this.domain;
				domain = x.map(Number);
				return rescale();
			},

			scale.range = function(x) {
				if(! arguments.length ) return range;
				range = x.map(Number);
				return rescale();
			};
		
			function interpolate(){
				return Math.round( (range[1] - range[0]) / domain.length);
			}
		
			return scale;
		}
	}; 
	
	w.Rassoci = r;
}(window));