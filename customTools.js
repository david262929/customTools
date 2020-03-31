window.customTools = {};
((global, window, document) => {
    /**
     * Controll saved data in local array which there is no access from the outside.
     *
     * ... usage ...
     *      cache.set('key_ajax_response', data);
     *
     *      cache.get('key_ajax_response');
     *
     *      cache.delete('key_ajax_response');
     *
     *
     * @constructor Cache
     * @method Cache set($key, $data)
     * @method Cache get($key)
     * @method Cache delete($key)
     */
    function Cache() {
        let self = this;
        let cache = [];

        const generate_key = ($key) => {
            return "front_cache_" + btoa(JSON.stringify($key));
        };

        /**
         * @param $key can be any type even an object
         * @returns {*}
         */
        this.get = ($key = {}) => {
            $key = generate_key($key);
            return cache[$key];
        };

        /**
         * Before adding data to a variable, it $key param converts to string after Encode it with btoa function
         * Push data to a local cache array with converted $key param
         *
         * @param $key can be any type even an object
         * @param $data
         * @returns {boolean}
         */
        this.set = ($key, $data = {}) => {
            $key = generate_key($key);
            cache[$key] = $data;
            return true;
        };

        this.delete = ($key) => {
            $key = generate_key($key);
            return (delete cache[$key]);
        };

        return this;
    }
    let cache = new Cache();
    global['cache'] = cache;

    /**
     * Generate an randomly string with 15 symbols, which can't repeat
     * Ability of a not repeating was ensure a saving already genereted keys in Cache
     *
     * ... usage ...
     *      generateRandomKey();
     *
     * @constructor RandomKeyGenerator
     * @method Cache generate_key()
     */
    function RandomKeyGenerator() {
        let self = this;
        let cache = global['cache'];

        const chars = [..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"];
        const randomly = (() => [...Array(15)].map(i => chars[Math.random() * chars.length | 0]).join(``));
        const key_of_admincache_for_generated_keys = 'generated_keys_' + randomly();
        cache.set(key_of_admincache_for_generated_keys, []);

        /**
         * @returns {*} Characters of an key can be letter (upper or lower case), numbers and Symbols
         */
        this.generate_key = () => {
            while (true) {
                let $new_key = randomly();
                const generated_keys = cache.get(key_of_admincache_for_generated_keys);
                if (!generated_keys.includes($new_key)) {
                    generated_keys.push($new_key);
                    cache.set(key_of_admincache_for_generated_keys, generated_keys);
                    return $new_key;
                }
            }
        };

        return this;
    }
    let randomKeyGenerator = new RandomKeyGenerator();
    global['generateRandomKey'] = () => {
        return randomKeyGenerator.generate_key();
    };

    /**
     * Add ability for create custom events and call it when need.
     * All event list save in Cache.
     *
     * ... usage ...
     *      // calculate when scrolled 25% of screen to call
     *      if( 25%_scrolled ){
     *          customEventListener.call_event('scrolled_25_percent', params_if_you_want);
     *      }
     *      customEventListener.on('scrolled_25_percent', callback () => {});
     *
     * ... usage ...
     *      // For remove these event listener call this
     *      customEventListener.remove_all_events('scrolled_25_percent');
     *
     * ... usage ...
     *      // For attach these methods for another object named object_1, call this
     *      customEventListener.attach_listener_to_obj( object_1 );
     *
     *
     * @constructor CustomEventListener
     * @method CustomEventListener on(event, callback)
     * @method CustomEventListener call_event(event, ...params)
     * @method CustomEventListener remove_event(event)
     * @method CustomEventListener attach_listener_to_obj(object, )
     */
    function CustomEventListener() {
        let self = this;
        let cache = global['cache'];
        const custom_events_list_key = 'custom_events_list' + global['generateRandomKey']();
        cache.set(custom_events_list_key, []);


        const get_event_list = () => cache.get(custom_events_list_key);
        const set_event_list = (callbacks = []) => cache.set(custom_events_list_key, callbacks);

        /**
         * Pushes the callback to an array, under the key which named with event variable in custom_events_list array
         *
         * @param event
         * @param callback
         */
        this.on = (event = null, callback = () => {} ) => {
            if (typeof event == 'undefined' || event == null || event == '' || typeof callback != 'function') {
                return;
            }

            let event_list = get_event_list();
            if (!Array.isArray(event_list[event])) {
                event_list[event] = [];
            }
            event_list[event].push(callback);
            set_event_list(event_list);
            return self;
        };

        /**
         * Call all callbacks which saves under the key named as event variable and put all parameters
         *
         * @param event
         * @param params
         */
        this.call_event = (event = null, ...params) => {
            if (typeof event != 'string' || event == null || event == '') {
                return;
            }

            let event_list = get_event_list();
            if (Array.isArray(event_list[event])) {
                event_list[event].forEach((callback) => {
                    // In try catch for Call event all callbacks regardless of an errors
                    try {
                        callback(...params);
                    } catch (error) {
                        console.error(error);
                    }
                });
            }
            // return self;
        };

        /**
         * Delete an array with callbacks under the key named as event variable
         *
         * @param event {boolean}
         */
        this.remove_all_events = (event = null) => {
            if (typeof event != 'string' || event == null || event == '') {
                return;
            }
            let event_list = get_event_list();
            if (Array.isArray(event_list[event])) {
                delete event_list[event];
                return set_event_list(event_list);
            }
            return;
        };

        /**
         * Ability beside of an global custom event listener can add to an object
         *    passed like parameter methods (on, call_event and remove_event).
         * Ability of a not repeating these event names with global customEventListener event names
         *    was ensure a saving callback under the event which concated with
         *    random key, generated with RandomKeyGenerator
         *
         * @param object
         * @param key first piece of key
         */
        this.attach_listener_to_obj = (object = null, key = '') => {
            if (!object || typeof key != 'string') {
                return;
            }

            const customEventListener_key = key + global['generateRandomKey']();
            object.on = (event = null, callback = () => {
            }) => {
                if (typeof event != 'string' || event == '') {
                    return;
                }
                event = customEventListener_key + event;
                return self.on(event, callback);
            };
            object.call_event = (event = null, ...params) => {
                if (typeof event != 'string' || event == '') {
                    return;
                }
                event = customEventListener_key + event;
                return self.call_event(event, ...params);
            };
            object.remove_all_events = (event = null, ...params) => {
                if (typeof event != 'string' || event == '') {
                    return;
                }
                event = customEventListener_key + event;
                return self.remove_all_events(event, ...params);
            };

        };

    }
    global['customEventListener'] = new CustomEventListener();

    /**
     * Check is object a DOM element
     *
     * ... usage ...
     *      // isDomElement( element )
     *
     * @param elem
     * @returns {boolean|*}
     */
    const isDomElement = (elem = null) => {
        try {
            if (typeof elem === "string" && elem != "") {
                elem = document.querySelector('#' + elem);
            }

            if (typeof elem === "undefined" || elem == null) {
                return false;
            }

            throw "Parameter is not a number!";
        } catch (e) {
            return (typeof HTMLElement === "object" ? elem instanceof HTMLElement : elem != "" && typeof elem === "object" && elem !== null && elem.nodeType === 1 && typeof elem.nodeName === "string" && typeof elem.ownerDocument === "object" && elem);
        }
    };
    global['isDomElement'] = isDomElement;

    const getStringValue = (inString) => {
        if (inString == null || ['undefined', 'null', '[object]', '[object NodeList]', '[object HTMLBodyElement]'].includes(inString) ) {
            return "";
        }

        try {
            let tString = new String(inString);
            return tString.toString();
        } catch (e) {
            return "";
        }
    };
    global['getStringValue'] = getStringValue;

    const isEmptyObject = (obj) => {
        for(let key in obj) {
            if(obj.hasOwnProperty(key)){
                return false;
            }
        }
        return true;
    };

    /**
     * Check is empty.
     *
     * ... usage ...
     *      isNullOrEmpty( '' ); // true
     *      isNullOrEmpty( {} ); // true
     *      isNullOrEmpty( [] ); // true
     *      isNullOrEmpty( null ); // true
     *      isNullOrEmpty( undefined ); // true
     *
     *      isNullOrEmpty( 'text' ); // false
     *      isNullOrEmpty( dom_element ); // false
     *      isNullOrEmpty( object ); // false
     *      isNullOrEmpty( [0] ); // false
     *      isNullOrEmpty( [ 'volume' : .5 ] ); // false
     *
     * @param obj
     * @returns {boolean}
     */
    const isNullOrEmpty = (obj) => {
        // must test type of base object first
        if (typeof obj == "undefined") {
            return true;
        }

        // immediate
        if (obj == undefined || obj == null || !obj ) {
            return true;
        }

        // Array or associative array
        if( Array.isArray(obj)){
            if(!!Object.keys(obj).length){
                return false;
            }
            if(!obj.length){
                return true;
            }
        }

        // Empty object or DOM element
        if ( typeof obj == 'object' ){
            if(isDomElement(obj)){
                return false;
            }
            if(isEmptyObject(obj)){
                return true
            }
        }
        // STRING
        return getStringValue(obj) == "";
    };
    global['isNullOrEmpty'] = isNullOrEmpty;


    /**
     *  It get first key of an object or associative array
     *
     * ... usage ...
     *      get_first_key_of_object( empty ); // false
     *      get_first_key_of_object( '' ); // false
     *      get_first_key_of_object( DomElement ); // false
     *      get_first_key_of_object( [] ); // false
     *
     *      get_first_key_of_object( { volume : .5 } ); // 'volume'
     *      get_first_key_of_object( [11111, aaaa: "aaaaaaaa"] ); // '0'
     *
     *
     * @param data
     * @returns {string|boolean}
     */
    const get_first_key_of_object = (data) => {
        if(isNullOrEmpty(data) || typeof data != 'object' || isDomElement(data) || !Array.isArray(data)){
            return false;
        }
        for (var prop in data){
            if (data.propertyIsEnumerable(prop)){
                return prop;
            }
        }
        return false;
    };

    /**
     *
     * Round
     *
     * ... usage ...
     *    round(12345.6789, 2) // 12345.68
     *    round(12345.6789, 1) // 12345.7
     *
     * ... defaults to round to nearest whole number (precision 0) ...
     *    round(12345.6789) // 12346
     *
     * ... can be used to round to nearest 10 or 100 etc...
     *    round(12345.6789, -1) // 12350
     *    round(12345.6789, -2) // 12300
     *
     * ... correct handling of negative numbers ...
     *    round(-123.45, 1) // -123.4
     *    round(123.45, 1) // 123.5
     *
     * ... can be combined with toFixed to format consistently as string ...
     *    round(456.7, 2).toFixed(2) // "456.70"
     *
     * @param value
     * @param precision
     * @returns {number}
     */
    global['round'] = (value, precision = 0) => {
        const multiplier = Math.pow(10, precision);
        return Math.round(value * multiplier) / multiplier;
    };

    global['is_mob'] = () => (
        !!(window.navigator.userAgent.match(/Android/i)
            || window.navigator.userAgent.match(/webOS/i)
            || window.navigator.userAgent.match(/iPhone/i)
            || window.navigator.userAgent.match(/iPad/i)
            || window.navigator.userAgent.match(/iPod/i)
            || window.navigator.userAgent.match(/BlackBerry/i)
            || window.navigator.userAgent.match(/Windows Phone/i)
        )
    );

    global['isTouchDevice'] = () => (
        (window.navigator.maxTouchPoints > 0) || (window.navigator.MaxTouchPoints > 0) || (window.navigator.msMaxTouchPoints > 0)
    );

    /**
     * ... usage ...
     *      insertAfter(moving_element, origin_element);
     *
     * @param moving_element
     * @param origin_element
     * @returns {*}
     */
    global['insertAfter'] = (moving_element, origin_element) => {
        const r = origin_element.parentNode,
            o = origin_element.nextSibling;
        return o ? r.insertBefore(moving_element, o) : r.appendChild(moving_element)
    };

    /**
     * To clone object without reference
     *
     * ... usage ...
     *      const obj = { volume : .5 };
     *
     *      const obj_reference = obj;
     *      obj_reference.volume = 1; // obj = { volume : 1 }
     *
     *      const obj_clone = clone_object( obj );
     *      obj_clone.volume = .7;   // obj = { volume : .5 }
     *
     * @param obj
     * @returns {null|*}
     */
    global['clone_object'] = (obj = null) => {
        if (isNullOrEmpty(obj)) {
            return null;
        };

        let copy = obj.constructor();
        for (let attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = obj[attr];
            }
        }
        return copy;
    };

    /**
     * To Shuffle array.
     *
     * ... usage ...
     *      const array = [1,2,3,4,5,6,7,8,9];
     *      shuffle_array( array ); // [2,9,1,8,6,5,3,4,7];
     *      shuffle_array( array ); // [7,9,4,6,8,5,1,3,2];
     *
     * @param array
     * @returns {*[]|*}
     */
    global['shuffle_array'] = (array) => {
        if (isNullOrEmpty(array)) {
            return [];
        };

        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    /**
     *
     * ... usage ...
     *      trim( '' ); // ''
     *      trim( ' text' ); // 'text'
     *      trim( ' text ' ); // 'text'
     *      trim( 'text ' ); // 'text'
     *      trim( 'text' ); // 'text'
     *
     * @param inString
     * @returns {string}
     */
    global['trim'] = (inString) => {
        return inString.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    /**
     * Get display state.
     * mobile / tabletportrait / tabletlandscape / nonedesktop / desktop
     *
     */
    const resetState = () => {
        const width = global.innerWidth;
        if (width < 868) {
            global.deviceSize = 'mobile';
        } else if (width >= 868 && w < 1024) {
            global.deviceSize = 'tabletportrait';
        } else if (width >= 1024 && w < 1080) {
            global.deviceSize = 'tabletlandscape';
        } else if (width >= 1080 && w < 1280) {
            global.deviceSize = 'nonedesktop';
        } else {
            global.deviceSize = 'desktop';
        }
    };
    resetState();
    window.addEventListener('resize', resetState);

    /**
     *
     * ... usage ...
     *      callback = ( blocked_or_not ) => {
     *          return blocked_or_not ? 'Blocked.' : 'Not blocked.';
     *      };
     *      is_ads_blocked( callback );
     *
     *
     * Check if have installed ad block in webpage.
     * @param callback
     */
    global['is_ads_blocked'] = (callback) => {
        let testURL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

        let myInit = {
            method: 'HEAD',
            mode: 'no-cors'
        };

        let myRequest = new Request(testURL, myInit);

        fetch(myRequest).then((response) => {
            return response;
        }).then((response) => {
            callback(false);
        }).catch((e) => {
            callback(true);
        });
    };


    /**
     *
     * ... usage ...
     *      callback = ( blocked_or_not ) => {
     */
    ((global, window, document) => {

        function VideoPlayQueue() {
            const key_prefix = "key_";
            const html = document.documentElement;

            window.elements_calculate_area = [];
            let elements_calculate_area;
            elements_calculate_area  = window.elements_calculate_area;

            let last = {less_distance : Infinity};

            const check_element_proximity_to_center_of_screen = (element, key, is_scroll_event) => {
                if(!elements_calculate_area.hasOwnProperty(key) || !is_scroll_event){
                    return;
                }

                if(!is_scroll_event && !!element.onlyScrollForAutoplay){
                    return;
                }

                const html_element = element.html_element;

                let html_element_rect = html_element.getBoundingClientRect();
                let visual_screen_half = html.clientHeight / 2;

                let top = html_element_rect.top,
                    bottom = html_element_rect.bottom;

                let other_html_element = ((!last.element) || (last.element && !last.element.html_element) || (last.element.html_element && last.element.html_element != html_element));

                if( bottom < 40 || html.clientHeight - top < 40){
                    if(last.element && !other_html_element){
                        last.element.deactivate();
                        last = {less_distance : Infinity};
                    }
                    return;
                }

                let offset_top_of_center = Math.abs(top - visual_screen_half);
                let offset_bottom_of_center = Math.abs(bottom - visual_screen_half);

                let current_less_distance = Math.min( offset_top_of_center, offset_bottom_of_center);

                let less_distance;
                if(other_html_element){
                    less_distance =  last.less_distance > current_less_distance ? current_less_distance : false;
                }else{
                    less_distance = current_less_distance;
                }

                if(less_distance){
                    if(other_html_element && current_less_distance != last.less_distance){
                        if(last.element && last.element.html_element){
                            last.element.deactivate();
                        }
                    }

                    element.activate();
                    last = {
                        less_distance,
                        element,
                        key,
                    };
                }

            };

            const recheck_all = (event) => {
                if(isNullOrEmpty(elements_calculate_area)){
                    return;
                }

                const is_scroll_event = (event.type == 'scroll')

                if(!last.element){
                    const first_key = get_first_key_of_object(elements_calculate_area);
                    const first_element = first_key ? elements_calculate_area[first_key] : null;
                    if(first_element){
                        check_element_proximity_to_center_of_screen(first_element, first_key, is_scroll_event);
                    }
                }else{
                    check_element_proximity_to_center_of_screen(last.element, last.key, is_scroll_event);
                }

                for (var key in elements_calculate_area){
                    check_element_proximity_to_center_of_screen(elements_calculate_area[key], key, is_scroll_event);
                }
            };
            recheck_all();


            window.addEventListener("scroll", recheck_all);
            window.addEventListener('touchstart', recheck_all);
            window.addEventListener('click', recheck_all);
            window.addEventListener('change', recheck_all);
            window.addEventListener('select', recheck_all);
            window.addEventListener('touchstart', recheck_all);
            window.addEventListener('wheel', recheck_all);
            window.addEventListener('resize', recheck_all);
            window.addEventListener('keydown', recheck_all);
            window.addEventListener('keypress', recheck_all);
            window.addEventListener('keyup', recheck_all);
            window.addEventListener('mousedown', recheck_all);
            window.addEventListener('mouseenter', recheck_all);
            window.addEventListener('mouseleave', recheck_all);
            window.addEventListener('mousemove', recheck_all);
            window.addEventListener('mouseover', recheck_all);
            window.addEventListener('mouseout', recheck_all);
            window.addEventListener('mouseup', recheck_all);
            window.addEventListener('resize', recheck_all);
            window.addEventListener('search', recheck_all);
            window.addEventListener('touchstart', recheck_all);
            window.addEventListener('touchcancel', recheck_all);
            window.addEventListener('touchend', recheck_all);
            window.addEventListener('touchmove', recheck_all);
            window.addEventListener('touchstart', recheck_all);

            /**
             * ... usage ...
             *
             *    const data = {
             *       html_element : _self.player,
             *       activate : () => {
             *           // console.log('autoplay play');
             *           _self.play();
             *       },
             *       deactivate : () => {
             *           // console.log('autoplay pause');
             *           _self.pause();
             *       },
             *       onlyScrollForAutoplay : false, // Default false
             *    };
             *    smartPlayQueue.add(_self.info.autoplay_key, data);
             *
             * @param key
             *  Need for Unique key for after can control that element in queue.
             *
             * @param data
             *  Required structure for data:
             *    const data = {
             *       @html_element   //  html_element,
             *       @activate     //  function
             *       @deactivate   //  function
             *       @onlyScrollForAutoplay //  Boolean //  Default false
             *    };
             *
             * @returns {boolean}
             */
            this.add = (key = null, data = {}) => {
                if( isNullOrEmpty(key) || isNullOrEmpty(data) ){
                    return false;
                }

                if(
                    typeof key !== 'string'
                    || isNullOrEmpty(data.html_element)
                    || !isDomElement(data.html_element)
                    || typeof data.activate !== "function"
                    || typeof data.deactivate !== "function"
                ){
                    return false;
                }
                if( typeof data.onlyScrollForAutoplay != 'boolean' ){
                    data.onlyScrollForAutoplay = false;
                }

                return !!(elements_calculate_area[key_prefix + key] = data);
            };

            /**
             * Remove element from queue
             *
             * @param key
             * @returns {boolean}
             */
            this.remove = (key = null) => {
                if( isNullOrEmpty(key) ) {
                    return;
                }
                if(elements_calculate_area.hasOwnProperty(key_prefix + key)){
                    return delete elements_calculate_area[key_prefix + key];
                }else{
                }
            };

            /**
             * Will activate only when scroll event
             *
             * @param key
             * @returns {boolean}
             */
            this.letOnlyScrollForAutoplay = (key = null) => {
                if( isNullOrEmpty(key) ) {
                    return;
                }

                if( elements_calculate_area.hasOwnProperty(key_prefix + key) ) {
                    return elements_calculate_area[key_prefix + key].onlyScrollForAutoplay = true;
                }
            };

            /**
             * Will activate for all events
             *
             * @param key
             * @returns {boolean}
             */
            this.setAllEventsForAutoplay = (key = null) => {
                if( isNullOrEmpty(key) ) {
                    return;
                }

                if( elements_calculate_area.hasOwnProperty(key_prefix + key) ) {
                    return elements_calculate_area[key_prefix + key].onlyScrollForAutoplay = false;
                }
            };

        }
        global['videoPlayQueue'] = new VideoPlayQueue();
    })(global, window, document);

})(customTools, window, document);
