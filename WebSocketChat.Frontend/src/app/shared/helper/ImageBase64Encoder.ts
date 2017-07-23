export class ImageBase64Encoder {

   /**
    * Provided by https://gist.github.com/HaNdTriX/7704632 and modified for a little bit type-safety.
   */
   public static encodeToBase64(imageUrl: string, outputFormat, callback: (base64String: string) => any) {
      // Create an Image object
      var img = new Image();
      // Add CORS approval to prevent a tainted canvas
      img.crossOrigin = 'Anonymous';

      img.onload = function() {
         // Create an html canvas element
         var canvas: any = document.createElement('CANVAS');
         // Create a 2d context
         var ctx = canvas.getContext('2d');
         // Resize the canavas to the original image dimensions
         canvas.height = img.naturalHeight;
         canvas.width = img.naturalWidth;
         // Draw the image to a canvas 
         ctx.drawImage(this, 0, 0);

         // Convert the canvas to a data url
         let base64String: string = canvas.toDataURL(outputFormat);
         // Return the data url via callback
         callback(base64String);
         // Mark the canvas to be ready for garbage 
         // collection
         canvas = null;
      };
      // Load the image
      img.src = imageUrl;

      // make sure the load event fires for cached images too
      if (img.complete || img.complete === undefined) {
         // Flush cache
         img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
         // Try again
         img.src = imageUrl;
      }
   }
}
