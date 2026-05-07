using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MiddlewareWebAPI.Data.IRepository;
using MiddlewareWebAPI.Data.Model;
using MiddlewareWebAPI.Services.IServices;
using Org.BouncyCastle.Asn1.Ocsp;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;

namespace MiddlewareWebAPI.Services.Services
{
    public class EmployeeToColorService: IEmployeeToColorService
    {
        private readonly IEmployeeToColorRepository _colorRepository;
        public EmployeeToColorService(IEmployeeToColorRepository colorRepository)
        {
            _colorRepository = colorRepository;
        }

        public async Task<EmployeeToColorResponse> Index(GridRequest request)
        {
            return await _colorRepository.Index(request);
        }

        public async Task<MantisAllEmployeesLookupResponse> MantisAllEmployeesLookup()
        {
            return await _colorRepository.MantisAllEmployeesLookup();

        }
        public async Task<ApisResponse> Store(AddEmployeeColorRequest request)
        {
            return await _colorRepository.Store(request);
        }
        public async Task<EmployeeToColorDetailResponse> Show(int id)
        {
            return await _colorRepository.Show(id);
        }

        public async Task<ApisResponse> Update(UpdateEmployeeToColorRequest request, int id)
        {
            return await _colorRepository.Update(request, id);

        }
    }
}
