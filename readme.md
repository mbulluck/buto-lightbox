Buto.tv lightbox plugin
=======================

Buto.tv lightbox plugin created and tested with jquery 1.9.0
will create a image of the poster frame of a buto video
when you click on the image then you get a lightbox with the video 
inside ready to play.

The JS will call the Buto API to get some data about the video such
as poster frame uri, video uri in our CDN.  It's all CORS safe so don't worry
http://get.buto.tv

Included libraries thanks to:
https://github.com/jackmoore/colorbox/
https://github.com/fgnass/spin.js
Thanks dudes, your work is awesome

basic usage:    

    <div class='buto-lightbox-here' data-id='12345' style='width:451px;height:254px'>Buto Poster frame goes in here</div>
    
    $('div.buto-lightbox-here').butoLightbox();             
    
function will use basic dimensions that you've set of the container element
NB the data-id which must contain the buto video_id otherwise it won't work

License is MIT, go nuts; 'cos that's how we roll here at Buto
http://opensource.org/licenses/mit-license.php
