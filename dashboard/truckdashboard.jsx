import React, { useState, useEffect, useRef , Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import DashboardMenu from './DashboardMenu';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import '../../assets/styles.css';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { BreadCrumb } from 'primereact/breadcrumb';
import { DashboardService } from '../../service/DashboardService';
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

const TruckDashboard = (props) => {
  const menuLeft = useRef(null);  
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [trucks, setTrucks] = useState([]);    
  const [truckDetail, setTruckDetail] = useState([]);    
  const [modelMsg, setModelMsg] = useState(null);    
  const [displayConfirmation, setDisplayConfirmation] = useState(false);
  const [truckDetailModel, setTruckDetailModel] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0); 
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            rct_Code: { value: null, matchMode: 'contains' },
            status: { value: null, matchMode: 'contains' },

        }
    });
    let networkTimeout = null;

     const items = [{ label: 'Shipment' }, { label: 'Truck Dashboard'}];
    const home = { icon: 'pi pi-home', url: '/' }
    useEffect(() => {
       
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);
       

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            DashboardService.getAllOrderTruck( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setTrucks(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onSort = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };
    const getOrderTruckDetail = (id) => {
        setTruckDetail(null)
        setTruckDetailModel(true)
        setLoadingDetail(true);
        DashboardService.getTruckOrderDetail((id)).then((data) => {
            setTruckDetail(data.data);
            
        }).finally(setLoadingDetail(false));
    }
   
    
    const cancleModel = (reload = false) => {
        setTruckDetail(null)
        setTruckDetailModel(false);
        
    }

    const Refresh=()=>{
        loadLazyData();
    }

    return (
        <>
        <Dialog header="Truck Name: " receivingModel  visible={truckDetailModel} style={{ width: '50vw' }}
         position='top' onHide={() => {if (!truckDetailModel) return; cancleModel(); }}
         >
            
                    <p className="m-0">
                    <div className="flex flex-column px-8 py-5 gap-4" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9'}}>
                        { (modelMsg != '') ?  (<p className="p-error font-semibold">{modelMsg}</p>) : ''}
                    </div>
                    </p>
                    {(!truckDetail) ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <div className="card p-0 " >
                            <DataTable removableSort 
                            value={truckDetail} 
                            className="datatable-responsive" 
                            emptyMessage="No records found." 
                            showGridlines 
                            sort 
                            tableStyle={{ minWidth: '40rem' }} 
                            size="small" 
                            stripedRows 
                            loading={loadingDetail} scrollable scrollHeight="350px" 
                            >
                                <Column/>
                                <Column header="Order Code" field="loc_Code"    body={(data) => data.ord_Code}   />
                                <Column header="SSCC" field="stc_SSCC"   body={(data) => data.stc_SSCC}   />
                                <Column  header="Location"  field="ori_SSCC"   body={(data) => data.loc_Code}/>
                            </DataTable>
                        </div>
                    )}

        </Dialog>
        
       <BreadCrumb model={items} home={home} />
            <div class="flex flex-row-reverse flex-wrap">
                <div class="flex align-items-center justify-content-center">
                <Button 
                label="Refresh" 
                loading={loading} 
                onClick={Refresh} 
                severity="success" 
                icon="pi pi-refresh" 
                className="align-item-right"
                size="small" 
            />
                </div>
                
            </div>
            
         <div className="card">
            <h3>Truck Dashboard</h3>
            <DataTable  value={trucks} 
            className="datatable-responsive" 
            emptyMessage="No records found." 
            showGridlines 
            first={lazyState.first} 
            rows={lazyState.rows} 
            totalRecords={totalRecords}
            onPage={onPage}
            onSort={onSort}
            paginator
            scrollable
            removableSort
            sortOrder={lazyState.sortOrder}
            onFilter={onFilter} 
            filters={lazyState.filters} 
            rowsPerPageOptions={[25, 50, 100, 500, 1000]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
            sort 
            tableStyle={{ minWidth: '40rem' }} 
            size="small" 
            stripedRows 
            loading={loading}  scrollHeight="350px" 
            
            >
                <Column />
                <Column header="Truck Name" field="trk_Code"    body={(data) => data.trk_Code}   />
                <Column header="Doc" field="doc"   body={(data) => data.doc??0}   />
                <Column  header="Pallet Count"  field="NumberOfPallets"   body={(data) => data.NumberOfPallets??0}/>
                <Column header="View Detail"   field="outer_QTY"  headerStyle={{ width: '8%', minWidth: '6rem' }}   body={(data) => (
                    <Button label="View" severity="info" size="small" outlined  onClick={() => getOrderTruckDetail(data.trk_ID)}/>
                )}/>
            </DataTable>
         </div>    

        </>
    );
}

const comparisonFn = function (prevProps, nextProps) {
    return (prevProps.location.pathname === nextProps.location.pathname) && (prevProps.colorMode === nextProps.colorMode);
};

export default React.memo(TruckDashboard, comparisonFn);
