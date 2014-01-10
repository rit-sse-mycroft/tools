using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Speech.Recognition.SrgsGrammar;

namespace SRGS2XML
{
    interface ISRGSSpec
    {
        SrgsDocument SRGS();
    }
}
