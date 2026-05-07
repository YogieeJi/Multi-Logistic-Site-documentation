import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { DashboardService } from '../../service/DashboardService';
import { Helmet } from 'react-helmet';
import titles from '../titles';
import { Dropdown } from 'primereact/dropdown';
import '../../assets/styles.css';
import { ScrollPanel } from 'primereact/scrollpanel';
import ChartComponent from '../../components/ChartComponent';
import { InputText } from 'primereact/inputtext';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
const onRowEditComplete = (e) => {
    let _products = [...products];
    let { newData, index } = e;

    _products[index] = newData;

    setProducts(_products);
};

const textEditor = (options) => {
    return <InputText type="text" style={{ width: '90%' }} value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
};

    
   
    const errorLane = [
        { url: "https", sku_name: "Zero Watch", sku_code: "SM62492", qty: 21 },
        { url: "https", sku_name: "Alpha Watch", sku_code: "SM83354", qty: 24 },
        { url: "https", sku_name: "Beta Watch", sku_code: "SM75875", qty: 65 },
        { url: "https", sku_name: "Gamma Watch", sku_code: "SM58236", qty: 77 },
        { url: "https", sku_name: "Beta Watch", sku_code: "SM24724", qty: 50 },
        { url: "https", sku_name: "Beta Watch", sku_code: "SM40158", qty: 96 },
        { url: "https", sku_name: "Gamma Watch", sku_code: "SM17008", qty: 18 },
        { url: "https", sku_name: "Delta Watch", sku_code: "SM75875", qty: 29 },
        { url: "https", sku_name: "Gamma Watch", sku_code: "SM62492", qty: 54 },
        { url: "https", sku_name: "Gamma Watch", sku_code: "SM52028", qty: 70 },
        { url: "https", sku_name: "Zero Watch", sku_code: "SM94356", qty: 100 },
        { url: "https", sku_name: "Beta Watch", sku_code: "SM62517", qty: 85 },
        { url: "https", sku_name: "Beta Watch", sku_code: "SM17008", qty: 72 },
        { url: "https", sku_name: "Zero Watch", sku_code: "SM53941", qty: 21 },
        { url: "https", sku_name: "Zero Watch", sku_code: "SM40158", qty: 83 },
        { url: "https", sku_name: "Delta Watch", sku_code: "SM62492", qty: 12 },
        { url: "https", sku_name: "Beta Watch", sku_code: "SM53941", qty: 41 },
        { url: "https", sku_name: "Delta Watch", sku_code: "SM37353", qty: 5 },
        { url: "https", sku_name: "Delta Watch", sku_code: "SM75875", qty: 26 },
        { url: "https", sku_name: "Delta Watch", sku_code: "SM62517", qty: 83 }
    ];    
const Dashboard = (props) => {
    const [receipt, setReceipt] = useState(null);
    const [usersLane, setUsersLane] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayDeleteConfirmation, setDisplayDeleteConfirmation] = useState(false);
    const [lineOptions, setLineOptions] = useState(null)
    const [removeOldPlan, setRmoveOldPlan] = useState("false");
    const [editableSlotID, setEditableSlotID] = useState(0);
    const [editableUpc, setEditableUpc] = useState(0);
    const [selectedPlan, setSelectedPlan] = React.useState(null);
    const navigate = useNavigate();
    const menuLeft = useRef(null);
    const [loading, setLoading] = useState(false);
    const [userLaneLoading, setUserLaneLoading] = useState(false);
    const [receivingPlanData, setReceivingPlanData] = useState([]);
    const [selectedSlotName, setSelectedSlotName] = useState('');
    const [selectedUpcName, setSelectedUpcName] = useState('');
    const [removeAbleData, setRemoveAbleData] = useState(null);
    const [receivingModel, setReceivingModel] = useState(false);
    const [allSlots, setAllSlots] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [slotmsg, setSlotmsg] = useState('');
    const [upcmsg, setUpcmsg] = useState('');
    const [receivingMsg, setReceivingMsg] = useState('');
    const [laneStatusChart, setLaneStatusChart] = useState([]);
    const [errorLaneStatus, setErrorLaneStatus] = useState([]);
    const [containerMark, setContainerMark] = useState('');
    const toast = useRef();
    /*const laneStatusChart = [
        {"Lane": "Lane 1",
          "Progress": 30,
          "BarData": [
            30,85,70,60,40
          ]
        },{
          "Lane": "Lane 2",
          "Progress": 81,
          "BarData": [
            10,25,60,80
          ]
        },{
          "Lane": "Lane 3",
          "Progress": 100,
          "BarData": [
            95,16,36,0
          ]
        },{
          "Lane": "Lane 4",
          "Progress": 89,
          "BarData": [
            47,100,64,32
          ]
        }
      ]; */
    
    let defaultValues = { 
        slot: '',
        upc: '',
        qty: '',
    };

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;
    
    const onReceivingRowEditComplete = (e) => {
        setLoading(true);
        let _receivingPlanData = [...receivingPlanData];
        let { newData, index } = e;
        
        const id = e.data.id;
        
        const data = {
            slot_id: (editableSlotID != 0 ) ? editableSlotID : newData.slot_id,
            upc: newData.upc,
            qty: newData.qty_pallet_to_cases
        };
        newData.title = (selectedSlotName != '') ? selectedSlotName: newData.title;
        newData.slot_id = (editableSlotID != 0 ) ? editableSlotID : newData.slot_id;
       
        DashboardService.updateReceivingPlan(id,data).then((data) => {
           
           
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Data Updated.', detail: data.message});
               
                
                _receivingPlanData[index] = newData;
                
                setReceivingPlanData(_receivingPlanData);
                setEditableSlotID(0);
                setSelectedSlotName('');
                setLoading(false);
                

            } else{
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error while update.', detail: data.message});
            }
        });

    };
    const applyLightTheme = () => {
        const lineOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef',
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef',
                    }
                },
            }
        };

        setLineOptions(lineOptions)
    }

    const applyDarkTheme = () => {
        const lineOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#ebedef'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)',
                    }
                },
                y: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)',
                    }
                },
            }
        };

        setLineOptions(lineOptions)
    }
    const colorsMap = {
        'Black' : '#000000' ,
        'Red' : '#ff0000' ,
        'Green' : '#00ff00' ,
        'Orange' : '#ffa500' ,
        'Blue' : '#0000ff' ,
        'Purple' : '#800080' ,
        'Cyan' : '#00ffff' ,
    };
    useEffect(() => {
        DashboardService.getPendingReceipt().then(data => setReceipt(data?.Data));
        DashboardService.getLaneStatus().then(data => { console.log(data); setLaneStatusChart(data?.laneData); setErrorLaneStatus(data?.ErrorLane) } );
        
        DashboardService.getAllSlots().then(data => {
            setAllSlots(data?.data);
          });
        DashboardService.getAllItems().then(data => {
            setAllItems(data?.data);
          });
        DashboardService.getAllSlots().then(data => {
            setAllSlots(data?.data);
          });
          setUserLaneLoading(true);
        DashboardService.getUserLane()
        .then(data => setUsersLane(data?.data))
        .finally(() => setUserLaneLoading(false));
    }, []);
   
    const slotsDropDownEditor = (rowData) => {
       
        return (
            <select className="select-box" onChange={(event) => { 
                setEditableSlotID(event.target.value); 
                const index = event.target.selectedIndex;
                setSelectedSlotName(event.target.options[index].text);
                }}>
                <option value="">Select Slot</option>    
                {allSlots.map(option => (
                    <option key={option.title} value={option.id} selected={(option.id == rowData?.rowData?.slot_id) ? 'selected': ''} >
                        {option.title}
                    </option>
                ))}
            </select>
        );
    };
    const itemsDropDownEditor = (rowData) => {
       
        return (
            <select className="select-box" onChange={(event) => { 
                setEditableUpc(event.target.value); 
                const index = event.target.selectedIndex;
                setSelectedUpcName(event.target.options[index].text)
                
                }}>
                <option value="">Select UPC</option> 
                {allItems.map(option => (
                    <option key={option.UPC} value={option.UPC} selected={(option.UPC == rowData?.rowData?.UPC) ? 'selected': ''} >
                        {option.UPC}
                    </option>
                ))}
            </select>
        );
    };
    
    useEffect(() => {
        if (props.colorMode === 'light') {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    }, [props.colorMode]);
    

    const getReceivingPlans = (value) => {
        setSelectedPlan(value);
        const id = value.rct_ID;
        if(!id){
            toast.current.show({ severity: 'error', summary: 'Required Input', detail: 'Please select a receipt'});
            return false;
        }   
        setLoading(true);
       
        DashboardService.getReceivingPlan( (id) ).then((data) => {
            
            if(data.error == 0){
               
                setReceivingPlanData(data.data);
                
                setLoading(false);
               
            } else{
                setReceivingPlanData([]);
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error while Data fetching', detail: data.message});
            }
        });
        
        
    }
    const reGeneratePlan = () => {
        
        setDisplayConfirmation(false);
        generatePlan();
    };
    const generatePlan = () => {
        
        if(!selectedPlan){
            toast.current.show({ severity: 'error', summary: 'Required Input', detail: 'Please select a receipt'});
            return false;
        }   
        setLoading(true);
        const data ={
            removeoldplan: removeOldPlan
        };
        const id = selectedPlan.rct_ID;
        DashboardService.generateReceivingPlan(id,data).then((data) => {
           
            if(data.error == 0){
                setLoading(false);
                // check if status code is 409 then show popup
                
                if(data.code == 409){
                    setRmoveOldPlan("true");
                    setDisplayConfirmation(true);
                    
                }else{
                    setRmoveOldPlan("false");
                }
                
                 getReceivingPlans(selectedPlan);
                
                
               
            } else{
                setReceivingPlanData([]);
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error while Data fetching', detail: data.message});
            }
        });
        
        
    } 
    const userBodyTemplate = (rowData) => {
        
        const splitArray = rowData.usr_Logins?.split('|');
        
        const namesAndColorsArray  = splitArray?.map((item, index) => {
            const [name,color] = item.split(',');
            let concatedName = (splitArray.length - 1 === index) ? name : name+" | ";
            return (
                
                <span style={{color: colorsMap[color]}}>{concatedName}</span>
            )
        });
        
    
    return (
        <div className='pl-4'>
            {namesAndColorsArray}
        </div>
    );
};
    const actionBodyTemplate = (rowData) => {
        return (
           <>
            <Button icon="pi pi-trash" size="small" rounded severity="danger" aria-label="Delete" onClick={() => confirmationBox(rowData) }/>
           </>
        );
    };
    const confirmationBox = (rowData) => {
       
        setRemoveAbleData(rowData);
          
        setDisplayDeleteConfirmation(true);
    }
    const confirmationDeleteDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayDeleteConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => removePlan()} className="p-button-text" autoFocus />
        </>
    );
    const removePlan = () => {
        
        const id = removeAbleData.id;

        setLoading(true);
       
        DashboardService.deleteReceivingPlan( (id) ).then((data) => {
            
            if(data.error == 0){
                setDisplayDeleteConfirmation(false);
                setLoading(false);
                setRemoveAbleData(null);
                getReceivingPlans(selectedPlan);
                
               
               
            } else{
                setRemoveAbleData(null);
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error while Deletion', detail: data.message});
            }
        });

        
    };
    const actionItems = [
        {
            label: 'Color Mapping',
            icon: 'pi pi-palette',
            command: () => {
                navigate("/setup/color-mapping")
                
            }
        },
        {
            label: 'Manage Lane Users',
            icon: 'pi pi-users',
            command: () => {
                navigate("/setup/lanes")
                
            }
        },
      
    ];
    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reGeneratePlan()} className="p-button-text" autoFocus />
        </>
    );
    const cancleModel = (reload = false) => {

        setReceivingModel(false)

        form.reset();
        setEditableSlotID(0);
        setSelectedSlotName('');
        setEditableUpc(0);
        setSelectedUpcName('');
        setSlotmsg('');setReceivingMsg(''); setUpcmsg(''); 
        if(reload == true) {getReceivingPlans(selectedPlan)}
    }
    const onSubmit = (data) => {
           
            if(selectedPlan == null) {
                setReceivingMsg("Select receipt ID first.") ;
                return false;
            }else{
                setReceivingMsg('')  
            }
            if(editableSlotID == 0) {
                setSlotmsg("Slot is required.") ;
                return false;
            }else{
                setSlotmsg('')  
            }
            if(editableUpc == 0) {
                setUpcmsg("UPC is required.");
                return false;
            }else{
                setUpcmsg('');
            }
            const req = {
                title : selectedUpcName,
                upc : editableUpc,
                slot_id : editableSlotID,
                qty : data.qty,
                ReceiptID : selectedPlan.rct_ID,
            }

            DashboardService.createReceivingItem(req).then((data) => {
           
           
                if(data.error == 0){
                    toast.current.show({ severity: 'success', summary: 'Receiving Item created.', detail: data.message});
                    
                   
                    cancleModel(true);
                    
                } else{
                    // setLoading(false);
                    setFormMsg(data.message)
                    // toast.current.show({ severity: 'error', summary: 'Error while creating.', detail: data.message});
                }
            });

    }
    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    }; 
    const markContainer = () => {
        const rct_ID  = selectedPlan.rct_ID
        
        const data = {
            id: rct_ID,
            action: (containerMark == '') ? "arrived" : "completed"
        };
       
        DashboardService.markContainer(data).then((data) => {
           
           
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Marked successfully.', detail: data.message});
                setContainerMark('');
                setSelectedPlan(null)
                setReceivingPlanData([]);
            } else{
                setLoading(false);
                if( data.code == 409 ) { setContainerMark('completed');} 
                toast.current.show({ severity: 'error', summary: 'Error Occur.', detail: data.message});
            }
        });
    }    
    return (
        <>
        <Helmet>
            <title>{titles.Dashboard}</title>
        </Helmet>
        <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Receipt plan already exists, do you want to regenerate receipt plan?</span>
                </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayDeleteConfirmation} onHide={() => setDisplayDeleteConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDeleteDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to delete?</span>
                </div>
        </Dialog>
        <Toast ref={toast} />
        <div className="grid">
            
            <div className="col-12 lg:col-6 xl:col-8">
                
                    <Dropdown 
                        value={selectedPlan} 
                        options={receipt} 
                        onChange={(e) => getReceivingPlans(e.value)} 
                        optionLabel="rct_Code" 
                        placeholder="Select" 
                        style={{ width: '300px' }} // Custom width
                    />
                    <Button label="Generate Receiving Plan" loading={loading} onClick={generatePlan} severity="primary" className='ml-4'/> 
                
            </div>
            <div className="col-12 lg:col-6 xl:col-4 flex justify-content-end">
                {/* <Button label="Complete" severity="success" className='px-6'/>   */}
            </div>
            

            <div className="col-12 xl:col-8">
                <div className="custom-card">
                    
                    <div className='flex justify-content-between flex-wrap'>
                        <h5 className=' pt-2'>Receiving Plan</h5>
                        <div>
                           { (receivingPlanData != '' ) ? 
                            <Button label={ (containerMark == '') ? 'Mark As Arrived' : 'Mark As Completed' } 
                            size='small' icon="pi pi-check" severity={ (containerMark == '') ? 'primary' : 'success'} 
                            className="custome-small-btn"  onClick={() => markContainer()}  /> 
                            : ''}
                        </div>
                        
                            
                        
                    
                    </div>
                    <DataTable value={receivingPlanData} size="small" stripedRows loading={loading} scrollable scrollHeight="470px" editMode="row" dataKey="ide" onRowEditComplete={onReceivingRowEditComplete}>
                        <Column header="Lane" field="lane" body={(data) => data.lane}  style={{width: '20%' }} />
                        <Column field="slot_id" editor={(options) => slotsDropDownEditor(options)} header="Slot"  style={{width: '20%' }} body={(data) => data.title}/>
                        <Column field="upc" editor={(options) => textEditor( options)} header="Item Code"  style={{width: '30%'}} body={(data) => data.upc}/>
                        <Column header="Qty" field='qty_pallet_to_cases' editor={(options) => textEditor(options)} style={{width:'20%'}} body={(data) => data.qty_pallet_to_cases} />
                        <Column   headerStyle={{ width: '5%', minWidth: '6rem' }} bodyStyle={{ textAlign: 'right' }}  body={actionBodyTemplate} ></Column>
                        <Column   rowEditor="true"  headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'left' }}></Column>
                    </DataTable>
                    <div className="footer-buttons flex justify-content-end flex-wrap">
                    { (selectedPlan != null) ?
                    <button className="add-button flex align-items-left justify-content-left" onClick={() => setReceivingModel(true)}>
                        Add Receiving Plan +
                    </button>
                    : ''
                    }
                    </div>
                </div>
                
            </div>
            <Dialog header="Add New Receiving Plan" visible={receivingModel} style={{ width: '30vw' }} position='top' onHide={() => {if (!receivingModel) return; cancleModel(); }}>
                <p className="m-0">
                <div className="flex flex-column px-8 py-5 gap-4" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9'}}>
                    { (receivingMsg != '') ?  (<p className="p-error font-semibold">{receivingMsg}</p>) : ''}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="">   

                        <div className="inline-flex flex-column gap-2 pb-2">
                             <Controller
                                name="slot"
                                control={form.control}
                                
                                render={({ field, fieldState }) => (
                                    <>
                                        <label className="font-semibold">Slot</label>
                                        {slotsDropDownEditor([])}   
                                        { (slotmsg != '') ?  (<small className="p-error">{slotmsg}</small>) : ''}
                                    </>
                                )}
                            />
                            
                        </div>
                        <div className="inline-flex flex-column gap-2 pb-2">
                           
                            <Controller
                                name="upc"
                                control={form.control}
                                
                                render={({ field, fieldState }) => (
                                    <>
                                        <label className="font-semibold">UPC</label>
                                        {itemsDropDownEditor([])}   
                                        { (upcmsg != '') ?  (<small className="p-error">{upcmsg}</small>) : ''}
                                    </>
                                )}
                            />
                        </div>
                        <div className="inline-flex flex-column gap-2 pb-5">
                            
                            <Controller
                                name="qty"
                                control={form.control}
                                rules={{ 
                                    required: 'Quantity is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label className="font-semibold">Qty</label>
                                        <InputText id={field.name} 
                                            value={field.value} 
                                            type="number" 
                                            className={classNames({ 'p-invalid': fieldState.error })} 
                                            onChange={(e) => {
                                                field.onChange(e.target.value)
                                            }} 
                                        />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                        <div className="flex align-items-center gap-2">
                            <Button label="Save" type='submit' className="p-3 w-full " icon="pi pi-check" size="small" ></Button>
                            <Button label="Cancel"  type='button' onClick={() => cancleModel()}  icon="pi pi-times" size="small" className="p-3 w-full "></Button>
                        </div>
                    </form>
                    </div>
                </p>
            </Dialog>
            <div className="col-12 xl:col-4">
                <div className="custom-card">
                    <div className='flex justify-content-between flex-wrap'>
                        <div><h5 className='pt-2'>User Lane</h5></div>
                        <div>
                            <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                            <Button label="Setup" size='small' icon="pi pi-cog" className="custome-small-btn" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
                        </div>
                        
                            
                        
                    
                    </div>
                    
                        <DataTable value={usersLane} size="small" loading={userLaneLoading} scrollable scrollHeight="208px" editMode="row" dataKey="id" onRowEditComplete={onRowEditComplete}>
                            <Column field="Lane" header="Lane"   style={{width: '30%' }} body={(data) => data.lane}/>
                            <Column field="User Name" header="User Name" style={{width: '70%'}} body={userBodyTemplate} />
                        </DataTable>
                    
                </div>

                <div className="custom-card">
                    <h5>Error Lane</h5>
                    
                    <DataTable value={errorLaneStatus} size="small" scrollable scrollHeight="208px" dataKey="ide" >
                        <Column field="SKU" header="SKU"   style={{width: '80%' }} body={(data) => {
                            return (
                                <div className="flex align-items-center gap-3">
                                    <img alt="flag" src={`assets/demo/images/product/chakra-bracelet.jpg`}   style={{ width: '34px',height: '26px' }} />
                                    <div className='flex flex-column'>
                                        <div className='flex align-items-center justify-content-center text-sm'>{data.SKU}</div>
                                        <div className='flex align-items-center justify-content-center text-xs'>{data.UPC}</div>
                                    </div>    
                                </div>
                            );
                        }}/>
                        <Column field="QTY" header="Qty" style={{width: '20%'}} body={(data) => data.QTY}/>
                        
                    </DataTable>
                    
                </div>
               
            </div>
            
        </div>
        <div className="chart-container">
            {laneStatusChart.map((item, index) => (
                
                <ChartComponent
                    key={index}
                    lane={item.Lane}
                    progress={item.Progress}
                    barData={item.BarData}
                />
            ))}
        </div>
        </>
    );
}

const comparisonFn = function (prevProps, nextProps) {
    return (prevProps.location.pathname === nextProps.location.pathname) && (prevProps.colorMode === nextProps.colorMode);
};

export default React.memo(Dashboard, comparisonFn);
