using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Helper
{
    public static class ImageUrlToBase64Encoder
    {
        public static string GetImageAsBase64Url(string url)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    var loadTask = client.GetByteArrayAsync(url);
                    loadTask.Wait();
                    var bytes = loadTask.Result;
                    return "data:image/jpg;base64," + Convert.ToBase64String(bytes);
                }
            }
            catch(Exception ex)
            {

            }

            return "";
        }
    }
}
