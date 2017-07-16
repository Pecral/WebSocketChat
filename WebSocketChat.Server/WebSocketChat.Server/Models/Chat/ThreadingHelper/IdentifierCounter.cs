using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebSocketChat.Server.Models.Chat.ThreadingHelper
{
    public class IdentifierIncreaser
    {
        private int _privateCounter = 0;

        public int CurrentIdentifier
        {
            get
            {
                //return current counter and increase it immediately so that it can't be reused
                return _privateCounter++;
            }
        }
    }
}
