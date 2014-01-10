using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Speech.Recognition.SrgsGrammar;

namespace SRGS2XML
{
    class Example : ISRGSSpec
    {
        private SrgsDocument doc;

        public Example()
        {
            doc = new SrgsDocument();

            SrgsRule whatis = new SrgsRule("whatis");

            SrgsItem question = new SrgsItem("what is");
            SrgsOneOf closers = new SrgsOneOf("life", "the time", "love", "happiness", "two plus two");

            whatis.Add(question);
            whatis.Add(closers);
            whatis.Scope = SrgsRuleScope.Public;

            doc.Rules.Add(whatis);
            doc.Root = whatis;
        }

        public SrgsDocument SRGS()
        {
            return doc;
        }
    }
}
