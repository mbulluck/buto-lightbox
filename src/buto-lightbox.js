/**
* Buto.tv lightbox plugin created and tested with jquery 1.9.0
* will create a image of the poster frame of a buto video
* when you click on the image then you get a lightbox with the video 
* inside ready to play.
* The JS will call the Buto api to get some data about the video such
* as poster frame uri, video uri in our CDN.  It's all CORS safe so don't worry
* our api supports Jsonp so that's how we get the ie6+ support
* @link text http://get.buto.tv
* 
* Included libraries thanks to:
* @link https://github.com/jackmoore/colorbox/
* @link https://github.com/fgnass/spin.js
* Thanks dudes, your work is awesome
* 
* basic usage:    
* <div class='buto-lightbox-here' data-id='12345' style='width:451px;height:254px'>Buto Poster frame goes in here</div>
* $('div.buto-lightbox-here').butoLightbox();             
* function will use basic dimensions that you've set of the container element
* NB the data-id which must contain the buto video_id otherwise it won't work
* 
* License is MIT, go nuts; 'cos that's how we roll here at Buto
* @link http://opensource.org/licenses/mit-license.php
* 
*/
(function($) {
   /**
    * 
    * method Get's the json api data from the BUTO api
    * @private
    * @param string object_id the buto video/playlist/livestream id
    * @param string uri the uri to the buto api 
    * @returns void have to use 'promise' to get the data a it's async http://stackoverflow.com/questions/5316697/jquery-return-data-after-ajax-call-success
    */
   var getObjectData = function(object_id, uri) {
       return $.ajax({
           dataType: "jsonp",
           type: 'get',
           jsonpCallback:'callback' + object_id + 'a', //each callback has to have a uniqiue name otherwise the namespace gets poluted and things go very funky indeed
           url: uri + '/' + object_id + '.jsonp?callback=?' //buto's v2 api supports JsonP - oh yeah!!!!
       });
   };

   /**
    * buto light box function
    * @param mixed options user specified options, will override defaults
    * @returns this for fluid interface
    */
   $.fn.butoLightbox = function(options) {
       var settings = $.extend({// Create some defaults, extending them with any options that were provided
           api_uri: '//api.buto.tv/v2/video'
       }, options);
       return this.each(function() {
           
           var element = $(this); //assign to a slightly global var 'cos we'll need it later when we go into a deeper scope

           //get the video_id
           var object_id = element.data('id');

           //start spinner before we call data
           var spinner = new Spinner().spin(this);

           //get video data
           var video_response = getObjectData(object_id, settings.api_uri);
           
           //on successful retrieval of the video json
           video_response.success(function(data) {  
               
               //create an <a> element
               var anchor = $('<a>').prop('href', '//embed.buto.tv/' + object_id).prop('title', data.media_title);

               //create poster frame image
               var image = $('<img>').prop('src', data.uri.poster_frame).prop('alt', data.media_title);

               if (element.height()===0 || element.height() === undefined) { //if the height is not specified (width will always be specified as it will default to parent width, but height will be 0 if not speccd)
                   image.prop('height', data.published_height).prop('width', data.published_width); //use json width & height
               }
               else {
                   image.prop('width', element.width()).prop('height', element.height());
               }

               //put image into anchor tags
               anchor.html(image);

               //instantiate lightbox courtesy of http://www.jacklmoore.com/colorbox/
               anchor.colorbox({iframe: true, innerWidth: data.published_width, innerHeight: data.published_height});

               //stop the spinner
               spinner.stop();

               //append content to div
               element.append(anchor);
           });
       });
   };
})(jQuery);