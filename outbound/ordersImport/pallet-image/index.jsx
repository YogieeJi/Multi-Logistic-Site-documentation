import { Badge } from 'primereact/badge';
import { ProgressSpinner } from 'primereact/progressspinner'
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Checkbox } from "primereact/checkbox";
import { Link, useNavigate,useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Dialog } from 'primereact/dialog';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { Menubar } from 'primereact/menubar';
import OrderMenu from '../OrderMenu';
import { Menu } from 'primereact/menu';
import { Dropdown } from 'primereact/dropdown';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { LocationsService } from '../../../../service/misc/LocationsService';
import { RadioButton } from 'primereact/radiobutton';

export default function Users() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [userTask, setUsersTask] = useState(null);
    const [displayConfirmation9, setDisplayConfirmation9] = useState(false);
    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [btnDisabled, setbtnDisabled] = useState(true);
   const [selectedImages, setSelectedImages] = useState([]);
   const [displayConfirmation7, setDisplayConfirmation7] = useState(false);
    const toast = useRef();
    const navigate = useNavigate();
    const [selectedAisle, setSelectedAisle] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [consolidateType, setConsolidateType] = useState('full');
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
         
            osi_QuantitySU: { value: null, matchMode: 'contains' },
            ori_ItemUnit: { value: null, matchMode: 'contains' },
            osi_Quantity: { value: null, matchMode: 'contains' },      
            Product: { value: null, matchMode: 'contains' },
        }
    });

   

    const dispatch = useDispatch()
    const params = useParams();


    let networkTimeout = null;


    useEffect(() => {
        loadLazyData();
    }, [lazyState]);
    // useEffect(() => {
    //     if (selectedImages.length == 2) {
    //       setDisplayConfirmation7(true);
    //     } else {
    //       setDisplayConfirmation7(false);
    //     }
    //   }, [selectedImages]);

    const loadLazyData = () => {
        setLoading(true);
        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            try{
            const data={};
            data.code = params.pick_list_id;
            const response =  OrdersImportService.getImages(data);
    
                if (response && response.error === 0 && response.data?.length) {
                    setUsers(response.data);
                } else {
                    setUsers([]); 
                    toast.current.show({
                        severity: 'warn',
                        summary: 'No Data',
                        detail: response.message || 'No image data found'
                    });
                }
    
            } catch (error) {
                // console.error(error);
                // setUsers([]); // clear previous data
                //  toast.current.show({
                // //     severity: 'error',
                // //     summary: 'Error',
                // //     detail: 'No image data found'
                // });
            } finally {
                setLoading(false);
            }
        }, Math.random() * 100 + 250);
 
        UserSettingService.getMantisUsers().then((data) => {
           
            if(data.error == 0){
                setUsersDropdownlist(data.data);
            }
        });
    };


   
    const actionItems = [
        {
            label: 'Cancel Item',
            icon: 'fa fa-times',
            command: () => {
                if(selectedUsers != null && selectedUsers.length >= 1){   
                    setbtnDisabled(false) 
                    setDisplayConfirmation9(true)
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order item' });
                }
            }
        },]

       
    const menuLeft = useRef(null);
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">

            <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
            <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
            </span>
      
            
        </div>
    );
    const TOss = users?.map(item => item.TO_SSCC) || [];
    
   
    const handleMerge=()=> {
        // if (selectedImages.length !== 2) {
        //     toast.current.show({
        //       severity: 'warn',
        //       summary: 'Selection Required',
        //       detail: 'Please select exactly 2 pallet to merge.',
        //     });
        //     return;
        //   }
        try {
           
            const primary = selectedImages.slice(0, -1); // All except last
            const secondary = selectedImages[selectedImages.length - 1]; 
    
         const data ={
            From_SSCC: primary,
            To_SSCC: secondary,
            user: selectedUser,
            order:params.pick_list_id,
            Type:consolidateType
         }
         OrdersImportService.ConsolidatePallet((data)).then((data) => {
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setDisplayConfirmation7(false)
                setSelectedImages([])
                setSelectedUser(null)
                loadLazyData()
                setConsolidateType('full')
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
                setDisplayConfirmation7(false)
                setSelectedImages([])
                setSelectedUser(null)
                setConsolidateType('full')
            }
            setLoading(false);
        });
        
         
        } catch (error) {
          toast.current.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to merge images.',
          });
        }
      };
      const confirmationDialogFooter7 = (
       <div className="flex justify-content-end flex-wrap">
         <Button label="Cancel" icon="pi pi-times"  onClick={() => {setDisplayConfirmation7(false);setSelectedImages([]);setSelectedUser(null);}} className="p-button-secondary" />
        <Button label="Submit" icon="pi pi-check" onClick={() => {handleMerge(); setLoading(true); setDisplayConfirmation7(false);}}  />
</div>
    );
    const Refresh=()=>{
        loadLazyData();
    }
    return (
        <>
            <OrderMenu />

            <Dialog header="Consolidate Pallet" visible={displayConfirmation7} style={{ width: '40vw' }} onHide={() => {setDisplayConfirmation7(false); setSelectedImages([]);setSelectedUser(null)}} footer={confirmationDialogFooter7}>
                <div className="p-fluid formgrid grid">
                <div style={{ lineHeight: '0.5', marginLeft:'20px', marginBottom:'10px'}}>
                <h5>From SSCC: <strong>{selectedImages.slice(0, -1).join(', ')}</strong></h5>
                <h5>To SSCC: <strong>{selectedImages[selectedImages.length - 1]}</strong></h5>
                </div>

                 {/* Radio Buttons for Consolidate Type */}
                <div className="field col-12 md:col-9" style={{ marginBottom: '1rem', marginLeft: '10px' }}>
                    <label>Consolidation Type*</label>
                    <div className="flex align-items-center" style={{ gap: '1rem', marginTop: '0.5rem' }}>
                        <div className="field-radiobutton">
                            <RadioButton 
                                inputId="full" 
                                name="consolidateType" 
                                value="full" 
                                onChange={(e) => setConsolidateType(e.value)} 
                                checked={consolidateType === 'full'} 
                            />
                            <label htmlFor="full">Full Consolidate</label>
                        </div>
                        <div className="field-radiobutton">
                            <RadioButton 
                                inputId="partial" 
                                name="consolidateType" 
                                value="partial" 
                                onChange={(e) => setConsolidateType(e.value)} 
                                checked={consolidateType === 'partial'} 
                            />
                            <label htmlFor="partial">Partial Consolidate</label>
                        </div>
                    </div>
                </div>

                    <div className="field col-12 md:col-9">
                        <label>Users*</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={selectedUser}
                            optionValue="usr_ID" 
                            optionLabel="Name" 
                            onChange={(e) => {
                                setSelectedUser(e.value)     
                                setbtnDisabled(false)                           
                            }} 
                            options={usersDropdownlist} 
                            placeholder="Select User"  
                            filter={true}
                        />
                    </div>
                   
                </div>
            </Dialog>
           
            <div className="flex justify-content-between align-items-center mb-3">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="p-button-primary"
                    onClick={() => navigate("/outbound/orders-import")}
                />

                <Button 
                    label="Refresh" 
                    loading={loading} 
                    onClick={() => {Refresh();setDisplayConfirmation7(false);setSelectedImages([]);setSelectedUser(null);}} 
                    severity="success" 
                    icon="pi pi-refresh" 
                    size="small" 
                />
            </div>

                <Helmet>
                    <title>Order Pallet</title>
                </Helmet>

                <Toast ref={toast} />

                <div className="card">
                <div className="flex justify-content-between align-items-center mb-4">
                    <h3>Pallet Image</h3>
                    <Button
                    label="Consolidate Pallet"
                    icon="pi pi-clone"
                    onClick={() => {
                        setDisplayConfirmation7(true);
                      }}
                    disabled={selectedImages.length < 2}
                    className="p-button-success"
                    style={{ marginTop: '1rem' }}
                    />
                </div>

                {loading ? (
                     <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                     <ProgressSpinner />
                 </div>
                ) : users && users.length > 0 ? (
                    <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                    }}
                    >
                    {[...users]
                    .sort((a, b) => (a.Flag === 'shipped') - (b.Flag === 'shipped')) // shipped at the end
                    .map((user) => {

                        const isSelected = selectedImages.includes(user.sscc);
                        // const isFirstSelected = selectedImages[0] === user.sscc;
                        const isLastSelected = selectedImages[selectedImages.length - 1] === user.sscc;
                        const isShipped = user.Flag === 'shipped';
                            // isSelected && !isFirstSelected && selectedImages.length > 1;

                        const isDisabled = user.TO_SSCC || TOss.includes(user.sscc); 

                        // disable logic
                        return (
                        <div
                            key={user.sscc}
                            onClick={() => {
                                if (isDisabled) {
                                    toast.current?.show({
                                      severity: 'warn',
                                      summary: 'Not Selectable',
                                      detail: 'This pallet is part of a Consolidate operation',
                                    });
                                    return;
                                  }
                                if (user.Flag === 'shipped') {
                                    toast.current.show({
                                        severity: 'error',
                                        summary: 'Error',
                                        detail: 'You cannot select the loaded pallet',
                                      });
                                    
                                } else {
                                    setSelectedImages((prev) =>
                                        isSelected
                                            ? prev.filter((id) => id !== user.sscc)
                                            : [...prev, user.sscc]
                                    );
                                }
                            }}
                            style={{
                            border: isDisabled
                            ? '3px solid yellow':isSelected
                            ? selectedImages[0] === user.sscc
                            ? '3px solid red' 
                                : isLastSelected
                                ? '3px solid #32CD32 '
                                : '3px solid red'
                                : '1px solid #ccc',
                            borderRadius: '10px',
                            padding: '10px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            opacity: isShipped ? 0.5 : 1,
                            filter: isShipped ? 'grayscale(100%)' : 'none',
                            // pointerEvents: isShipped ? 'none' : 'auto', // Optional: blocks click
                            }}
                        >
                            <img
                            src={`data:image/bmp;base64, ${user.ImageData}`}
                            alt={`Image ${user.sscc}`}
                            style={{ width: '100%', borderRadius: '8px' }}
                            />
                            <div style={{ marginTop: '10px' }}>
                            <strong>SSCC:</strong> {user.sscc}
                            <br />
                            {/* <Checkbox
                                inputId={`cb-${user.sscc}`}
                                checked={isSelected}
                                onChange={() => {
                                setSelectedImages((prev) =>
                                    isSelected
                                    ? prev.filter((id) => id !== user.sscc)
                                    : [...prev, user.sscc]
                                );
                                }}
                            /> */}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                ) : (
                    <p>No image data found.</p>
                )}
                </div>
        </>
        
    );
}
        