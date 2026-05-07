
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { ZoneService } from '../../../../service/operations/ZoneService';
import { CountDetails } from '../../../../service/operations/count-details';
import '../../../../assets/styles.css';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { Dropdown } from 'primereact/dropdown';
export default function ItemLotExp() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [item, setItem] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    
    const [selectAll, setSelectAll] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            location_Code: { value: null, matchMode: 'contains' },
            Item_Code: { value: null, matchMode: 'contains' },
            Aisle: { value: null, matchMode: 'contains' },
            match1: { value: null, matchMode: 'contains' },
            match2: { value: null, matchMode: 'contains' },
            match3: { value: null, matchMode: 'contains' },
            adjustment_type: { value: null, matchMode: 'contains' },
        }
    });

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()

    const menuLeft = useRef(null);
    const items = [{ label: 'Count' }, { label: 'Count Detail'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
  
    useEffect(() => {
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);
        setItem(null);
        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        networkTimeout = setTimeout(() => {
            CountDetails.getCount( (lazyState) ).then((data) => {
                
                setTotalRecords(data.totalRecords);
                setItem(data.data.data);
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

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedItem(value);
        //setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        return false;
        const selectAll = event.checked;
        
        if (selectAll) {
           
            setSelectAll(true);
            setSelectedItem(item);
            
        } else {
            setSelectAll(false);
            setSelectedItem([]);
        }
    };

    const firstUserConfBodyTemplate = (rowData) => {
        return (
            <>{(rowData.Item_code_confirmation1 == 1)? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}</>
        );
    };
   
    
    const secUserConfBodyTemplate = (rowData) => {
        return (
            <>{(rowData.Item_code_confirmation2 == 1)? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}</>
        );
    };
    const thirdUserConfBodyTemplate = (rowData) => {
        return (
            <>{(rowData.Item_code_confirmation3 == 1)? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}</>
        );
    };

    const firstCountBodyTemplate = (rowData) => {
        
        let parts = (rowData.not_match1 != null) ? rowData.not_match1.split(',').map(part => part.trim()) : [];
        const containsLotNo = parts.includes("Lot no");
        const containsSSCC = parts.includes("SSCC");
        const containsExpiryDate = parts.includes("Expiry Date");
        const isAdjusted = (rowData.Adjusted == 0) ? (rowData.match1 == 'N' ||  rowData.match2 == 'N' ||  rowData.match3 == 'N') : false
        return (
            <>
                <div>
                    <>{(rowData.match1 != null )? <Badge value="Yes" severity="success"></Badge> : <Badge value="NotPerformed" severity="warning"></Badge>}</>
                </div>
                {(isAdjusted === true) ? (
                <div className='flex flex-row pt-1'>
                    {containsLotNo && (  <i class="fa-solid fa-circle" style={{color: "#ffff00"}}></i> )}
                    {containsSSCC && (  <i class="fa-solid fa-circle" style={{color: "#ff0000"}}></i> )}
                    {containsExpiryDate && (  <i class="fa-solid fa-circle" style={{color: "#3399ff"}}></i> )}
                    
                </div>
                ) : ''}
            </>
            )
    }
    const secCountBodyTemplate = (rowData) => {
        let parts = (rowData.not_match2 != null) ? rowData.not_match2.split(',').map(part => part.trim()) : [];
        const containsLotNo = parts.includes("Lot no");
        const containsSSCC = parts.includes("SSCC");
        const containsExpiryDate = parts.includes("Expiry Date");
        const isAdjusted = (rowData.Adjusted == 0) ? (rowData.match1 == 'N' ||  rowData.match2 == 'N' ||  rowData.match3 == 'N') : false
       
        return (
            <>
            
                <div>
                    <>{(rowData.match2 != null )? <Badge value="Yes" severity="success"></Badge> : <Badge value="NotPerformed" severity="warning"></Badge>}</>
                </div>
                {(isAdjusted === true) ? (
                <div className='flex flex-row pt-1'>
                    {containsLotNo && (  <i class="fa-solid fa-circle" style={{color: "#ffff00"}}></i> )}
                    {containsSSCC && (  <i class="fa-solid fa-circle" style={{color: "#ff0000"}}></i> )}
                    {containsExpiryDate && (  <i class="fa-solid fa-circle" style={{color: "#3399ff"}}></i> )}
                    
                </div>
                ) : ''}
            </>
            )
    }
    const thirdCountBodyTemplate = (rowData) => {
        let parts = (rowData.not_match3 != null) ? rowData.not_match3.split(',').map(part => part.trim()) : [];
        const containsLotNo = parts.includes("Lot no");
        const containsSSCC = parts.includes("SSCC");
        const containsExpiryDate = parts.includes("Expiry Date");
        const isAdjusted = (rowData.Adjusted == 0) ? (rowData.match1 == 'N' ||  rowData.match2 == 'N' ||  rowData.match3 == 'N') : false
        return (
            <>
            
                <div>
                    <>{(rowData.match3 != null )? <Badge value="Yes" severity="success"></Badge> : <Badge value="NotPerformed" severity="warning"></Badge>}</>
                </div>
                {(isAdjusted === true) ? (
                <div className='flex flex-row pt-1'>
                    {containsLotNo && (  <i class="fa-solid fa-circle" style={{color: "#ffff00"}}></i> )}
                    {containsSSCC && (  <i class="fa-solid fa-circle" style={{color: "#ff0000"}}></i> )}
                    {containsExpiryDate && (  <i class="fa-solid fa-circle" style={{color: "#3399ff"}}></i> )}
                    
                </div>
                ) : ''}
            </>
            )
    }
    
    const ThirdLotScandateBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.match3 != null)? rowData.Item_Lot : ''}
            </>
        );
    };
    const SecLotScandateBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.match2 != null)? rowData.Item_Lot : ''}
            </>
        );
    };
    const Lot_confirmation1dateBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.Lot_confirmation1 == 1)? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };
    const Lot_confirmation2dateBodyTemplate = (rowData) => {
        return (
            <>
               {(rowData.Lot_confirmation1 == 1)? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };
    const Lot_confirmation3dateBodyTemplate = (rowData) => {
        return (
            <>
               {(rowData.Lot_confirmation3 == 1)? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };
    const MarkedEmptyUser1dateBodyTemplate = (rowData) => {
        return (
            <>
            {rowData.MarkedEmptyUser1 == 1 ? (
                <Badge value="Yes" severity="success"></Badge>
            ) : rowData.MarkedEmptyUser1 == 0 ? (
                <Badge value="No" severity="danger"></Badge>
            ) : (
                <Badge value="NotPerformed" severity="warning"></Badge>
            )}
        </>
        );
    };
    const MarkedEmptyUser2dateBodyTemplate = (rowData) => {
        return (
            <>
            {rowData.MarkedEmptyUser2 == 1 ? (
                <Badge value="Yes" severity="success"></Badge>
            ) : rowData.MarkedEmptyUser2 == 0 ? (
                <Badge value="No" severity="danger"></Badge>
            ) : (
                <Badge value="NotPerformed" severity="warning"></Badge>
            )}
        </>
        );
    };
    const MarkedEmptyUser3dateBodyTemplate = (rowData) => {
        return (
            <>
            {rowData.MarkedEmptyUser3 == 1 ? (
                <Badge value="Yes" severity="success"></Badge>
            ) :rowData.MarkedEmptyUser3 == 0 ? (
                <Badge value="No" severity="danger"></Badge>
            ) : (
                <Badge value="NotPerformed" severity="warning"></Badge>
            )}
        </>
        );
    };
   
    const adjustmentTypeBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.adjustment_type == 1) ? 'System': (rowData.adjustment_type == 2) ? 'Manual': ''}
            </>
        );
    };
    
    const LOTBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.Item_code_confirmation2}
            </>
        );
    };
    const Item_LotBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.Item_Lot}
            </>
        );
    };
    const actionItems = [
        {
            label: 'Manual Adjustment',
            icon: 'fa fa-sliders',
            command: () => {
                if(selectedItem != null && selectedItem.length > 0){
                   setbtnDisabled(true) 
                   onclick(setDisplayConfirmation(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        }
       
    ];
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button size='small' label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
            </span>
            <span className=" mt-2 md:mt-0 p-input-icon-left ">
                <span><i class="fa-solid fa-circle" style={{color: "#ffff00"}}></i>Item Lot</span> 
                <span className='ml-2'><i class="fa-solid fa-circle" style={{color: "#ff0000"}}></i> SSCC</span>
                <span className='ml-2'><i class="fa-solid fa-circle" style={{color: "#3399ff"}}></i> Expiry Issue</span>
                
            
            </span>
        </div>
    );
    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markManualAdjustment()} className="p-button-text" autoFocus />
        </>
    );
    
    const rowClassName = (rowData) => {
    
     
     
        return {
            'row-red': ( rowData.Adjusted == 0) ? (rowData.match1 == 'N' ||  rowData.match2 == 'N' ||  rowData.match3 == 'N') : false,
           
        };
    };
  
    const markManualAdjustment = () => {
        setLoading(true);
        setbtnDisabled(true);
        const data = {
            count: selectedItem,
        }
        // console.log(data)
        CountDetails.markManualAdjustment( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                setDisplayConfirmation(false)
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                loadLazyData();
                setSelectAll(false);
                setSelectedItem(null);
                
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation(false)
        });
        
    };
    
    const globalFlags = [
        { code: 'Y', name: 'Yes' },
        { code: 'N', name: 'NotPerformed' },
    ];
    const IssueFlags = [
        { code: '0', name: 'Count with Issue' },
        { code: '1', name: 'System Adj.' },
        { code: '2', name: 'Manual Adj.' },
    ];
    const globalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} 
            optionValue="code" optionLabel="name"  options={globalFlags} 
            onChange={(e) => options.filterApplyCallback(e.value)} 
            itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear  />
        );
    };
    const issueRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} 
            optionValue="code" optionLabel="name"  options={IssueFlags} 
            onChange={(e) => options.filterApplyCallback(e.value)} 
            itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear  />
        );
    };
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const getSeverity = (status) => {
        
        switch (status) {
            case 'Yes':
                return 'success';

            case 'No':
                return 'danger';
            case 'Count with Issue':
                return 'danger';
            case 'System Adj.':
                return 'info';
            case 'Manual Adj.':
                return 'primary';
            case 'NotPerformed':
                return 'warning';
            default:
                return 'primary'

        }
    };
    return (
        <>
        <Helmet>
            <title>Count Report | Sagis</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        
        <h1></h1>
        <div className="card">
            <h3>Count Detail</h3>
            <DataTable 
                value={item} 
                lazy 
                filterDisplay="row" 
                dataKey="countdetail_Id" 
                Key="countdetail_Id" 
                paginator
                showGridlines
                first={lazyState.first} 
                rows={lazyState.rows} 
                totalRecords={totalRecords} 
                onPage={onPage}
                onSort={onSort} 
                size={'small'}
                sortField={lazyState.sortField}    
                className="datatable-responsive"
                sortOrder={lazyState.sortOrder}
                onFilter={onFilter} 
                filters={lazyState.filters} 
                rowsPerPageOptions={[10, 25, 50, 100]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedItem} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
                rowClassName={rowClassName}
            >   
                {/* item code */}
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                <Column field="Aisle" headerStyle={{ paddingLeft: '40px', paddingRight: '40px' }}  header="Aisle" body={(rowData) => rowData.Aisle} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="location_Code" headerStyle={{ paddingLeft: '40px', paddingRight: '40px' }}  header="Location" body={(rowData) => rowData.location_Code} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="match1"  header="1st Count" body={firstCountBodyTemplate} filter showFilterMenu={false} filterElement={globalRowFilterTemplate} />  
                <Column field="match2"  header="2nd Count" body={secCountBodyTemplate} filter showFilterMenu={false} filterElement={globalRowFilterTemplate} />  
                <Column field="match3"  header="3rd Count" body={thirdCountBodyTemplate} filter showFilterMenu={false} filterElement={globalRowFilterTemplate} />  
                <Column field="Item_Code" headerStyle={{ paddingLeft: '40px', paddingRight: '40px' }} header="Syst. Item No" body={(rowData) => rowData.Item_Code}  showFilterMenu={false}  filter filterPlaceholder="Search" />
                <Column field="Item_Code"  header="User Item Scan" body={(rowData) => rowData.Item_Code}  />         
                <Column field="Item_code_confirmation1"  header="User Conf." body={firstUserConfBodyTemplate}/>         
                <Column field="Item_Code"  header="Sec. Syst. Item No" body={(rowData) => rowData.Item_Code}  />         
                <Column field="Item_Code"  header="Sec. User Item Scan" body={(rowData) => rowData.Item_Code}  />         
                <Column field="Item_code_confirmation2"  header="Sec. User Item Conf." body={secUserConfBodyTemplate}/>         
                <Column field="Item_Code"  header="Third. Syst. Item No" body={(rowData) => rowData.Item_Code}  />         
                <Column field="Item_Code"  header="Third. User Item Scan" body={(rowData) => rowData.Item_Code}  />         
                <Column field="Item_code_confirmation3"  header="Third. User Item Conf." body={thirdUserConfBodyTemplate}/>         
                
                {/* Item Lot */}
                <Column field="Item_Lot"  header="Syst. Lot No" body={(rowData) => rowData.Item_Lot}/>         
                <Column field="Item_Lot"  header="User Lot Scan" body={(rowData) => rowData.Item_Lot}/>         
                <Column field="Lot_confirmation1"  header="User Lot Conf." body={Lot_confirmation1dateBodyTemplate}/>         
                <Column field="Item_Lot"  header="Sec. Lot Scan" body={SecLotScandateBodyTemplate}/>         
                <Column field="Lot_confirmation2"  header="Sec. Lot Conf." body={Lot_confirmation2dateBodyTemplate}/>         
                <Column field="Item_Lot"  header="Third. Lot Scan" body={ThirdLotScandateBodyTemplate}/>         
                <Column field="Lot_confirmation3"  header="Third. Lot Conf." body={Lot_confirmation3dateBodyTemplate}/>         

                {/* expiry date */}
                <Column field="Sys_exp"  header="Syst. Exp. Date" body={(rowData) => rowData.Sys_exp}/>         
                <Column field="Exp1"  header="User Exp. Date" body={(rowData) => rowData.Exp1}/>         
                <Column field="Exp2"  header="Sec. User Exp Date" body={(rowData) => rowData.Exp2}/>         
                <Column field="Exp3"  header="Third. User Exp Date" body={(rowData) => rowData.Exp3}/>         

                {/* Qty */}
                <Column field="Sys_Init_Qty"  header="Syst. QTY" body={(rowData) => rowData.Sys_Init_Qty}/>         
                <Column field="FirstSysQty"  header="User 1 QTY" body={(rowData) => rowData.FirstUsrQty}/>         
                <Column field="SecondSysQty"  header="User 2 QTY" body={(rowData) => rowData.SecondUsrQty}/>         
                <Column field="ThirdSysQty"  header="User 3 QTY" body={(rowData) => rowData.ThirdUsrQty}/>         
                {/* Marked location */}
                <Column field="MarkedEmptyUser1"  header="User Marked Loc Emp." body={MarkedEmptyUser1dateBodyTemplate}/>         
                <Column field="MarkedEmptyUser2"  header="Sec. User Marked Emp." body={MarkedEmptyUser2dateBodyTemplate}/>         
                <Column field="MarkedEmptyUser3"  header="Third User Marked Emp." body={MarkedEmptyUser3dateBodyTemplate}/>         
                
                <Column field="Comment1"  header="User 1 Cmnt." body={(rowData) => rowData.Comment1}/>         
                <Column field="Comment2"  header="User 2 Cmnt." body={(rowData) => rowData.Comment2}/>         
                <Column field="Comment3"  header="User 3 Cmnt." body={(rowData) => rowData.Comment3}/>         
                <Column field="adjustment_type"  header="Adj. Type " body={adjustmentTypeBodyTemplate} filter showFilterMenu={false} filterElement={issueRowFilterTemplate}/>
            </DataTable>
        </div>
        </>
        
    );
}
        