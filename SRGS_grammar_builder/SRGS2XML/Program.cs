using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Speech.Recognition.SrgsGrammar;

namespace SRGS2XML
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 2) { 
                Console.WriteLine("Expected arguments in the form srgs2xml [classname] [outputfile]"); 
                return; 
            };
            var inname = args[0];
            var outname = args[1];

            var type = Type.GetType("SRGS2XML." + inname);
            Console.WriteLine(type);
            ISRGSSpec spec = (ISRGSSpec)System.Activator.CreateInstance(type); //Oh god, oh god, dynamic classes in C#

            XmlWriter writer = XmlWriter.Create(outname);
            spec.SRGS().WriteSrgs(writer);
            writer.Close();
        }
    }
}
