Buto.tv lightbox plugin
=======================

Buto.tv lightbox plugin created and tested with jquery 1.9.x
It will create a image of the poster frame of a Buto video on the Buto.tv platform

When you click on the image then you get a lightbox with the video 
inside ready to play.

The JS will call the Buto API to get some data about the video such
as poster frame uri, video uri in our CDN.  It's all CORS safe so don't worry.

Our api supports Jsonp so that's how we get the ie6+ support

Tested in all sorts of browsers, even works in ie6!

http://get.buto.tv

Thanks
------
Included libraries thanks to:

https://github.com/jackmoore/colorbox/

https://github.com/fgnass/spin.js

Thanks dudes, your work is awesome!

Usage
-----

basic usage:    

    <div class='buto-lightbox-here' data-id='12345' style='width:451px;height:254px'>Buto Poster frame goes in here</div>
    
    $('div.buto-lightbox-here').butoLightbox();             

Function will use basic dimensions that you've set of the container element

**NB** the *data-id* attribute of our DIV which must contain the unique Buto video_id otherwise the plugin won't know which video to load

**NB** Don't include the /src folder in your project, it's just there for you to browse through and debug with.

advanced usage:

    <div class='buto-lightbox-here' data-id='12345' style='width:451px;height:254px'>Buto Poster frame goes in here</div>

    $('div.buto-lightbox-here').butoLightbox({
        title:'video'
    });

A config of options can be injected in at the point of instantiation.

List of advanced properties that can be set:
*   `title` Set the title. Accepted values: `media` | `video`. Defaults to `media` title

Demo
----
Have a look at /demo.html or http://butovideo.github.com/buto-lightbox/ for some basic demo usage


License
-------

License is MIT, go nuts. That's how we roll here at Buto.

http://opensource.org/licenses/mit-license.php
