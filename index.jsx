import React, {lazy, Suspense}  from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import Dashboard from '../pages/dashboard/index';
import NoDashboard from '../pages/dashboard/NoDashboard';
import StaticDashboard from '../pages/static-dashboard/index';
import OrderDashboard from '../pages/dashboard/ordersdashboard';
import ServicesDashboard from '../pages/dashboard/servicesdashboard';
import TruckDashboard from '../pages/dashboard/truckdashboard';
// import Shipments from '../pages/inbound/shipments/grid';
// import ShipmentDetails from '../pages/inbound/shipments/detail';
import { history } from '../helpers';
import { PrivateRoute } from './PrivateRoute';

import PageSpinner from '../components/PageSpinner';
import NotFoundPage from '../pages/notfound';
import ItemConversion from '../pages/setups/item-conversion/grid';
import ManageTrucks from '../pages/trucks/manage-trucks/grid';
import AllUsers from '../pages/trucks/users/grid';
import CreateAllUsers from '../pages/trucks/users/create';
import AddItemConversion from '../pages/setups/item-conversion/create';
import AddTrucks from '../pages/trucks/manage-trucks/create';
import TruckShipment from '../pages/trucks/truck-shipments/grid';

import AddShipment from '../pages/outbound/shipment/create';
import MultipleShipment from '../pages/outbound/multipleShipment/create';
import ShipmentorderDetails from '../pages/outbound/shipment/detail';
import MultipleShipmentorderDetails from '../pages/outbound/multipleShipment/detail';
import AddUserType from '../pages/setups/user-types/create';
import UserType from '../pages/setups/user-types/grid';
import ItemConversionDetails from '../pages/setups/item-conversion/detail';
import PTLController from '../pages/operations/ptl-controller/grid';
import AddPTLController from '../pages/operations/ptl-controller/create';
import PTLControllerDetails from '../pages/operations/ptl-controller/detail';
import PicklistsReports from '../pages/reports/picklists';
import LanesSetup from '../pages/setups/add-lanes/grid';
import LanesSetupDetails from '../pages/setups/add-lanes/detail';
import AddLanesSetup from '../pages/setups/add-lanes/create';
import UserLanesSetup from '../pages/setups/add-lanes/laneusers';
import ColorMapping from '../pages/setups/color-mapping/grid';
import ZonesItems from '../pages/operations/zones/items/grid';
import LanesOperation from '../pages/operations/lanes/grid';
import StorageMapping from '../pages/operations/zones/storage-mapping/grid';
import ZoneStorageMapping from '../pages/operations/zones/storage-mapping/grid';
import AddZoneStorageMapping from '../pages/operations/zones/storage-mapping/create';
import StorageMappingDetails from '../pages/operations/zones/storage-mapping/detail';
import ManageOrderTask from '../pages/operations/manage-orders-task';
import ManageShipmentLocationsGrid from '../pages/operations/manage-shipment-location/grid';
import ManageShipmentLocations from '../pages/operations/manage-shipment-location/create';
import ItemLotExp from '../pages/operations/item-lot-exp/grid';
import AddItemLotExp from '../pages/operations/item-lot-exp/create';
import ItemLotExpDetails from '../pages/operations/item-lot-exp/detail';
import ViewReport from '../pages/reports/view';
import EmployeeColor from '../pages/operations/employee-color/grid';
import ReceiptToLane from '../pages/operations/receipt-lane/grid/index';
import EmployeeColorDetails from '../pages/operations/employee-color/detail';
import AddEmployeeColor from '../pages/operations/employee-color/create';
import MantisUser from '../pages/operations/mantisusers/index';
import OperationLogs from '../pages/operations/activityLogs/index';
import FailedJobs from '../pages/operations/failedjobs/index';
import Stock from '../pages/stock/item-stock/index';
import MixReceiving from '../pages/operations/mix-receiving/index';
import OfftimeReplenishment from '../pages/stock/off-time-replenishment/index';
import Count from '../pages/operations/count-details/grid';
import Createconveyor from '../pages/settings/conveyor-setting/create';
import Getconveyor from '../pages/settings/conveyor-setting/grid';

import OrderTasks from '../pages/outbound/ordersImport/order-task';
import OrderItem from '../pages/outbound/ordersImport/cancel-order';
import PalletImage from '../pages/outbound/ordersImport/pallet-image';
import OrderReAllocation from '../pages/outbound/orderReAllocation/grid';
import OrderReAllocationDetail from '../pages/outbound/orderReAllocation/detail';
import CancelOrderItem from '../pages/outbound/cancel-order/order-item';


import CountGrid from '../pages/count/setup/grid';
import CountCreate from '../pages/count/setup/create';
import UserDashboard from '../pages/dashboard/user-task/user-task';
import UserDetailDashboard from '../pages/dashboard/user-task/detail';
import UsersDetailTaskDashboard from '../pages/dashboard/user-task/userdetail';
import ShippingDashboard from '../pages/dashboard/shippingdashboard';
import TaskDashboard from '../pages/dashboard/taskdashboard';
import UserTaskReport from '../pages/dashboard/user-task-report';

import MultipleReceiptToLane from '../pages/operations/receipt-lane/grid/multiple';
import OrderSlot from '../pages/operations/order-slot/grid';
import OrderCreate from '../pages/operations/order-slot/create';                    

import ReceiptDashboard from '../pages/inbound/receiptDashboard/detail';                    

import Customer from '../pages/stock/customer-type/grid/index'
import Log from '../pages/settings/log/grid/index'

import CountPlanGrid from '../pages/count/countplan/grid/index';
import CountPlanDetail from '../pages/count/countplan/detail/index';

import OrderExportgrid from '../pages/outbound/order-export-dashboard/grid';
import OrderExportDetail from '../pages/outbound/order-export-dashboard/order-task';
import OrderExportgridnew from '../pages/outbound/order-export-dashboard-new/grid';
import OrderExportDetailnew from '../pages/outbound/order-export-dashboard-new/order-task';

import AdminUser from '../pages/trucks/admin-users/create';



import AdminUsergrid from '../pages/trucks/admin-users/grid';
const Shipments = lazy(() => import('../pages/inbound/shipments/grid'));
const ShipmentDetails = lazy(() => import('../pages/inbound/shipments/detail'));
const Containers = lazy(() => import('../pages/inbound/containers/grid'));
const ContainerDetails = lazy(() => import('../pages/inbound/containers/detail'));
const Transfers = lazy(() => import('../pages/inbound/transfers/grid'));
const TransferDetails = lazy(() => import('../pages/inbound/transfers/detail'));
const Receipts = lazy(() => import('../pages/inbound/receipts/grid'));
const ReceiptDetails = lazy(() => import('../pages/inbound/receipts/detail'));
const PendingReceiptsList = lazy(() => import('../pages/inbound/pendingReceipts/list'));
const InboundLogs = lazy(() => import('../pages/inbound/activityLogs'));
const InboundFileUpload = lazy(() => import('../pages/inbound/upload'));
const ManualContainers = lazy(() => import('../pages/inbound/manualContainers/grid'));
const ManualContainerDetails = lazy(() => import('../pages/inbound/manualContainers/detail'));

const SchedulerSettings = lazy(() => import('../pages/settings/scheduler'));

const Users = lazy(() => import('../pages/settings/users/grid'));
const AddUser = lazy(() => import('../pages/settings/users/create'));
const UserDetails = lazy(() => import('../pages/settings/users/detail'));

const NotificationSettings = lazy(() => import('../pages/settings/notification-setting/Index'));
const DynamicNotificationLogs = lazy(() => import('../pages/settings/notification-setting/view-log'));

const Roles = lazy(() => import('../pages/settings/roles/grid'));
const AddRole = lazy(() => import('../pages/settings/roles/create'));
const RoleDetails = lazy(() => import('../pages/settings/roles/detail'));

const OrderImport = lazy(() => import('../pages/outbound/ordersImport/grid'));
const ImportedOrderDetails = lazy(() => import('../pages/outbound/ordersImport/detail'));
const ManualOrdersDelivery = lazy(() => import('../pages/outbound/manualOrdersDelivery/grid'));

const CancelOrder = lazy(() => import('../pages/outbound/cancel-order/grid'));

const PickList = lazy(() => import('../pages/outbound/picklists/grid'));
const PickListDetails = lazy(() => import('../pages/outbound/picklists/detail'));
const OutboundLogs = lazy(() => import('../pages/outbound/activityLogs'));
const Delivery = lazy(() => import('../pages/outbound/deliveries/grid'));
const DeliveryDetails = lazy(() => import('../pages/outbound/deliveries/detail'));
const Shipment = lazy(() => import('../pages/outbound/shipment/grid'));
const GetMultipleShipment = lazy(() => import('../pages/outbound/multipleShipment/grid'));
const LoginPage = lazy(() => import('../pages/login/Login'));

const Products = lazy(() => import('../pages/products/items/grid'));
const ProductDetails = lazy(() => import('../pages/products/items/detail'));
const AddProduct = lazy(() => import('../pages/products/items/addProduct'));
const ShipperCaseUpc = lazy(() => import('../pages/products/shipperCaseUpc/searchUpc'));
const ItemReports = lazy(() => import('../pages/products/reports'));
const UnexpectedItems = lazy(() => import('../pages/products/unexpectedItems/grid'));


const MantisItems = lazy(() => import('../pages/products/mantisItems/grid'));

const BoxAddition = lazy(() => import('../pages/products/boxAddition/grid'));
const BoxAdditionDetails = lazy(() => import('../pages/products/boxAddition/detail'));
const AddBoxAddition = lazy(() => import('../pages/products/boxAddition/add'));

const EachPackUnitChange = lazy(() => import('../pages/products/eachPackUnitChange/grid'));
const EachPackUnitChangeDetails = lazy(() => import('../pages/products/eachPackUnitChange/detail'));
const AddEachPackUnitChange = lazy(() => import('../pages/products/eachPackUnitChange/add'));

const ContainerUnload = lazy(() => import('../pages/operations/container-unload'));
const ConveyorLanes = lazy(() => import('../pages/operations/conveyor-lanes/grid'));
const AddConveyorLanes = lazy(() => import('../pages/operations/conveyor-lanes/create'));
const ConveyorLaneDetails = lazy(() => import('../pages/operations/conveyor-lanes/detail'));
const ConveyorSlotDetails = lazy(() => import('../pages/operations/conveyor-slots/detail'));
const AddConveyorSlots = lazy(() => import('../pages/operations/conveyor-slots/create'));
const ConveyorSlots = lazy(() => import('../pages/operations/conveyor-slots/grid'));
const ConveyorItems = lazy(() => import('../pages/operations/conveyor-items'));
const Zones = lazy(() => import('../pages/operations/zones/list/grid'));
const AddZone = lazy(() => import('../pages/operations/zones/list/create'));
const ZoneDetails = lazy(() => import('../pages/operations/zones/list/detail'));
const OrderTask = lazy(() => import('../pages/operations/manage-orders-task'));
const PutawayTaskCreation = lazy(() => import('../pages/operations/putaway-task-creation'));


const TruckDetails = lazy(() => import('../pages/trucks/details'));

const SetupReports = lazy(() => import('../pages/setups/reports/grid'));
const AddSetupReport = lazy(() => import('../pages/setups/reports/create'));
const SetupReportDetails = lazy(() => import('../pages/setups/reports/detail'));

const ProductReports = lazy(() => import('../pages/reports/items'));
const TrucksReports = lazy(() => import('../pages/reports/trucks'));
const LocationsReports = lazy(() => import('../pages/reports/locations'));
const StocksReports = lazy(() => import('../pages/reports/stock'));
const OrdersReports = lazy(() => import('../pages/reports/orders'));
const IssuesReports = lazy(() => import('../pages/reports/issues'));
const ReceiptReports = lazy(() => import('../pages/reports/receipt'));
import ReceiptDashboardNew from '../pages/inbound/receiptDashboard/detail_V1';   

const ReceiptsExport = lazy(() => import('../pages/inbound/receipt-export/grid'));
const ReceiptsExportDetails = lazy(() => import('../pages/inbound/receipt-export/detail'));

const ReceiptSelection = lazy(() => import('../pages/inbound/receiptSelection/grid')); 
const ReceiptSelectionDetail = lazy(() => import('../pages/inbound/receiptSelection/detail')); 

const Accounting = lazy(() => import('../pages/inbound/accounting/grid')); 
const AccountingReceiptDetail = lazy(() => import('../pages/inbound/accounting/detail'));


export const AllRoutes = (props) => {
 // init custom history object to allow navigation from 
    // anywhere in the react app (inside or outside components)
    history.navigate = useNavigate();
    history.location = useLocation();
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<NoDashboard />} />
            
            <Route path="/conveyor-dashboard" element={<PrivateRoute permission="conveyor_dashboard" ><Dashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/order-dashboard" element={<PrivateRoute permission="order_dashboard"><OrderDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/services-dashboard" element={<PrivateRoute permission="services_dashboard"><ServicesDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/truck-dashboard" element={<PrivateRoute permission="truck_dashboard"><TruckDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/user-task-dashboard" element={<PrivateRoute permission="user_task_dashboard_tab"><UserDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/user-task-dashboard/:id/:name/:date" element={<PrivateRoute permission="user_task_dashboard"><UserDetailDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/user-task-detail/:id/:name/:date" element={<PrivateRoute permission="user_task_dashboard"><UsersDetailTaskDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/shipping-dashboard" element={<PrivateRoute permission="shipping_dashboard"><ShippingDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/task-dashboard" element={<PrivateRoute permission="task_dashboard"><TaskDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/user-task-report/:date" element={<PrivateRoute permission="user-task-report"><UserTaskReport colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            
            <Route path="/static-dashboard" element={<PrivateRoute><StaticDashboard colorMode={props.layoutColorMode} location={props.location} /></PrivateRoute>} />
            <Route path="/404" element={<NotFoundPage />} />
            //////////////// Inbound /////////////////////////////
            <Route path="/inbound/shipments" element={ <Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_shipments"><Shipments /></PrivateRoute></Suspense>} />
            <Route path="/inbound/shipments/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_shipments" ><ShipmentDetails /></PrivateRoute></Suspense>} />

            <Route path="/inbound/containers" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_containers"><Containers /></PrivateRoute></Suspense>} />
            <Route path="/inbound/containers/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_containers"><ContainerDetails /></PrivateRoute></Suspense>} />

            <Route path="/inbound/manual-containers" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_manual_containers"><ManualContainers /></PrivateRoute></Suspense>} />
            <Route path="/inbound/manual-containers/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_manual_containers"><ManualContainerDetails /></PrivateRoute></Suspense>} />

            <Route path="/inbound/transfers" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_transfers"><Transfers /></PrivateRoute></Suspense>} />
            <Route path="/inbound/transfers/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_transfers"><TransferDetails /></PrivateRoute></Suspense>} />

            <Route path="/inbound/receipts" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receipts"><Receipts /></PrivateRoute></Suspense>} />
            <Route path="/inbound/receipts/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receipts"><ReceiptDetails /></PrivateRoute></Suspense>} />

            <Route path="/inbound/pending-receipts/list" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_pendingReceipts"><PendingReceiptsList /></PrivateRoute></Suspense>} />

            <Route path="/inbound/file-upload" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_fileUpload"><InboundFileUpload /></PrivateRoute></Suspense>} />

            <Route path="/inbound/activity-logs" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_activityLogs"><InboundLogs /></PrivateRoute></Suspense>} />

            <Route path="/inbound/receipts-dashboard" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receiptsDashboard"><ReceiptDashboard /></PrivateRoute></Suspense>} />
            <Route path="/inbound/receiptDashboard/detail" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receiptsDashboardNew"><ReceiptDashboardNew /></PrivateRoute></Suspense>} />
            
            {/* New Receipt Export Page */}
            <Route path="/inbound/receipt-export" element={ <Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receiptsExport"><ReceiptsExport /></PrivateRoute></Suspense>} />
            <Route path="/inbound/receipt-export/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receiptsExport"><ReceiptsExportDetails /></PrivateRoute></Suspense>} />


               {/* New Receipts Selection Page */}
            <Route path="/inbound/receiptSelection" element={ <Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receiptSelection"><ReceiptSelection /></PrivateRoute></Suspense>} />
            <Route path="/inbound/receiptSelection/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_receiptSelection"><ReceiptSelectionDetail /></PrivateRoute></Suspense>} />

            {/* New  Accounting Page */}
            <Route path="/inbound/accounting" element={ <Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_accounting"><Accounting /></PrivateRoute></Suspense>} />
            <Route path="/inbound/accounting/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="inbound_accounting"><AccountingReceiptDetail /></PrivateRoute></Suspense>} />
            ///////////////////////////////////////////////////////

 
            //////////////// Outbound /////////////////////////////
            <Route path="/outbound/picklist" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_pickList"><PickList /></PrivateRoute></Suspense>} />
            <Route path="/outbound/picklist/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_pickList"><PickListDetails /></PrivateRoute></Suspense>} />

            <Route path="/outbound/orders-import" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualOrdersImport"><OrderImport /></PrivateRoute></Suspense>} />
            <Route path="/outbound/orders-import/:id/:pick_list_id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualOrdersImport"><ImportedOrderDetails /></PrivateRoute></Suspense>} />
            
            <Route path="/outbound/orders-import/order-task/:id/:pick_list_id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualOrdersImport"><OrderTasks /></PrivateRoute></Suspense>} />
            <Route path="/outbound/orders-import/order-item/:id/:pick_list_id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualOrdersImport"><OrderItem /></PrivateRoute></Suspense>} />
            <Route path="/outbound/orders-import/pallet-image/:id/:pick_list_id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualOrdersImport"><PalletImage /></PrivateRoute></Suspense>} />

            <Route path="/outbound/manual-orders-delivery" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualOrdersDelivery"><ManualOrdersDelivery /></PrivateRoute></Suspense>} />

            <Route path="/outbound/delivery" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_delivery"><Delivery /></PrivateRoute></Suspense>} />
            <Route path="/outbound/delivery/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_delivery"><DeliveryDetails /></PrivateRoute></Suspense>} />
            
            //////////////// Cancel Order /////////////////////////////
            <Route path="/outbound/cancel-order" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualCancelOrder"><CancelOrder /></PrivateRoute></Suspense>} />
            <Route path="/outbound/cancel-order/order-item/:id/:pick_list_id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_manualCancelOrder"><CancelOrderItem /></PrivateRoute></Suspense>} />

            <Route path="/outbound/activity-logs" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_activityLogs"><OutboundLogs /></PrivateRoute></Suspense>} />
            <Route path="/outbound/shipment" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_shipment"><Shipment/></PrivateRoute></Suspense>} />
            <Route path="/outbound/shipment-add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_shipment"><AddShipment /></PrivateRoute></Suspense>} />
            <Route path="/outbound/shipment/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_shipment"><ShipmentorderDetails /></PrivateRoute></Suspense>} />
            <Route path="/outbound/shipment/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_shipment"><AddShipment /></PrivateRoute></Suspense>} />


            ///////////////order export dashboard/////////////////////


            <Route path="/outbound/orders-export" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_orderexport"><OrderExportgrid /></PrivateRoute></Suspense>} />
            <Route path="/outbound/orders-export/:pick_list_id/:cus/:date/:is_exported" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_orderexport"><OrderExportDetail /></PrivateRoute></Suspense>} />

            //////////////////////order export dashboard new/////////////////////
          <Route path="/outbound/orders-export-dashboard-new" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_orderexport_new"><OrderExportgridnew /></PrivateRoute></Suspense>} />
          <Route path="/outbound/orders-export-dashboard-new/:pick_list_id/:cus/:date/:is_exported/:picklist_id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_orderexport_new"><OrderExportDetailnew /></PrivateRoute></Suspense>} />

            //////////////////////////////////// Multiple Shipment /////////////////



            <Route path="/outbound/multiple-shipment" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_multipleShipment"><GetMultipleShipment/></PrivateRoute></Suspense>} />
            {/* <Route path="/outbound/multiple-shipment-add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_multipleShipment"><MultipleShipment /></PrivateRoute></Suspense>} /> */}
            <Route path="/outbound/multiple-shipment-add/:id" element={<Suspense fallback={<PageSpinner />}> <PrivateRoute permission="outbound_multipleShipment"><MultipleShipment /></PrivateRoute></Suspense>}/>
            <Route path="/outbound/multiple-shipment/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_multipleShipment"><MultipleShipmentorderDetails /></PrivateRoute></Suspense>} />
            <Route path="/outbound/multiple-shipment/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_multipleShipment"><MultipleShipment /></PrivateRoute></Suspense>} />
            ////////////////////////////order re allocation/////////////////////////
            <Route path="/outbound/orders-reallocation" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_orderReAllocation"><OrderReAllocation/></PrivateRoute></Suspense>} />
            <Route path="/outbound/orders-reallocation/:id/:pick_list_id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="outbound_orderReAllocation"><OrderReAllocationDetail /></PrivateRoute></Suspense>} />

            /////////////////////////////////////////////////////

            
            //////////////// Product /////////////////////////////
            <Route path="/products/items" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_items"><Products /></PrivateRoute></Suspense>} />
            <Route path="/products/items/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_items"><ProductDetails /></PrivateRoute></Suspense>} />
            <Route path="/products/items/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_items"><AddProduct /></PrivateRoute></Suspense>} />
            <Route path="/products/items/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_items"><AddProduct /></PrivateRoute></Suspense>} />

            <Route path="/products/mantis-items" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_mantis_items"><MantisItems /></PrivateRoute></Suspense>} />

            <Route path="/products/unexpected-items" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_unexpected_items"><UnexpectedItems /></PrivateRoute></Suspense>} />

            <Route path="/products/shipper-case-upc" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_shipperCaseUpc"><ShipperCaseUpc /></PrivateRoute></Suspense>} />

            <Route path="/products/box-addition" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_boxAddition"><BoxAddition /></PrivateRoute></Suspense>} />
            <Route path="/products/box-addition/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_boxAddition"><BoxAdditionDetails /></PrivateRoute></Suspense>} />
            <Route path="/products/box-addition/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_boxAddition"><AddBoxAddition /></PrivateRoute></Suspense>} />
            <Route path="/products/box-addition/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_boxAddition"><AddBoxAddition /></PrivateRoute></Suspense>} />

            <Route path="/products/each-pack-unit-change" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_eachPackUnitChange"><EachPackUnitChange /></PrivateRoute></Suspense>} />
            <Route path="/products/each-pack-unit-change/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_eachPackUnitChange"><EachPackUnitChangeDetails /></PrivateRoute></Suspense>} />
            <Route path="/products/each-pack-unit-change/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_eachPackUnitChange"><AddEachPackUnitChange /></PrivateRoute></Suspense>} />
            <Route path="/products/each-pack-unit-change/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_eachPackUnitChange"><AddEachPackUnitChange /></PrivateRoute></Suspense>} />

            <Route path="/products/reports" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="products_reports"><ItemReports /></PrivateRoute></Suspense>} />

            //////////////////////////stock///////////////////////////

            <Route path="/stock/item-stock" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="item-stock"><Stock/></PrivateRoute></Suspense>} />
            <Route path="/stock/off-time-replenishment" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="off-time-replenishment"><OfftimeReplenishment /></PrivateRoute></Suspense>} />
            <Route path="/stock/customer" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="customer-ordertype"><Customer/></PrivateRoute></Suspense>} />



            ////////////////////////////
                ///////////  Count Setup /////////////////////////////
            <Route path="/count/setup" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="count-setup"><CountGrid /></PrivateRoute></Suspense>} />
            <Route path="/count/create" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="count-setup"><CountCreate /></PrivateRoute></Suspense>} />
            <Route path="/count/count-details" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="count-details"><Count/></PrivateRoute></Suspense>} />

            ////////////////count plan////////////////
            <Route path="/count/count-plan" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="count-plan"><CountPlanGrid /></PrivateRoute></Suspense>} />
            <Route path="/count/count-plan/:id/:code" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="count-plan"><CountPlanDetail /></PrivateRoute></Suspense>} />


          //////////////////////conveyor//////////////////////////////////////
            <Route path="/conveyor/conveyor-lanes" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorLanes"><ConveyorLanes /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/conveyor-lanes/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorLanes"><ConveyorLaneDetails /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/conveyor-lanes/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorLanes"><AddConveyorLanes /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/conveyor-lanes/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorLanes"><AddConveyorLanes /></PrivateRoute></Suspense>} />

            <Route path="/conveyor/conveyor-slots" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorSlots"><ConveyorSlots /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/conveyor-slots/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorSlots"><ConveyorSlotDetails /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/conveyor-slots/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorSlots"><AddConveyorSlots /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/conveyor-slots/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorSlots"><AddConveyorSlots /></PrivateRoute></Suspense>} />

            <Route path="/conveyor/conveyor-items" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorItems"><ConveyorItems /></PrivateRoute></Suspense>} />

            <Route path="conveyor/order-slot" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="order-slot"><OrderSlot /></PrivateRoute></Suspense>} />
            <Route path="conveyor/order-slot/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="order-slot"><OrderCreate /></PrivateRoute></Suspense>} />
            <Route path="conveyor/order-slot/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="order-slot"><OrderCreate /></PrivateRoute></Suspense>} />


            <Route path="/conveyor/ptl-controller" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_ptlController"><PTLController /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/ptl-controller/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_ptlController"><AddPTLController /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/ptl-controller/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_ptlController"><PTLControllerDetails /></PrivateRoute></Suspense>} />
            <Route path="/conveyor/ptl-controller/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_ptlController"><AddPTLController /></PrivateRoute></Suspense>} />
            
           <Route path="/conveyor/activity-logs" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_activityLogs"><OperationLogs /></PrivateRoute></Suspense>} />

            //////////////// Operations /////////////////////////////
            <Route path="/operations/lanes" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_lanes"><LanesOperation /></PrivateRoute></Suspense>} />

            <Route path="/container-unload" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_containerUnload"><ContainerUnload /></PrivateRoute></Suspense>} />
            <Route path="/operations/putaway-task-creation" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_putawayTaskCreation"><PutawayTaskCreation /></PrivateRoute></Suspense>} />
  
            <Route path="/operations/zones" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zones"><Zones /></PrivateRoute></Suspense>} />
            <Route path="/operations/zones/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zones"><AddZone /></PrivateRoute></Suspense>} />
            <Route path="/operations/zones/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zones"><ZoneDetails /></PrivateRoute></Suspense>} />
            <Route path="/operations/zones/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zones"><AddZone /></PrivateRoute></Suspense>} />

            <Route path="/operations/zones-items" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zones_items"><ZonesItems /></PrivateRoute></Suspense>} />

            <Route path="/operations/item-lot-expiry" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_itemLotExp"><ItemLotExp /></PrivateRoute></Suspense>} />
            <Route path="/operations/item-lot-expiry/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_itemLotExp"><AddItemLotExp /></PrivateRoute></Suspense>} />
            <Route path="/operations/item-lot-expiry/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_itemLotExp"><ItemLotExpDetails /></PrivateRoute></Suspense>} />
            <Route path="/operations/item-lot-expiry/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_itemLotExp"><AddItemLotExp /></PrivateRoute></Suspense>} />
            
            <Route path="/operations/employee-color" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_employeeColor"><EmployeeColor /></PrivateRoute></Suspense>} />
            <Route path="/operations/employee-color/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_employeeColor"><AddEmployeeColor /></PrivateRoute></Suspense>} />
            <Route path="/operations/employee-color/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_employeeColor"><EmployeeColorDetails /></PrivateRoute></Suspense>} />
            <Route path="/operations/employee-color/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_employeeColor"><AddEmployeeColor /></PrivateRoute></Suspense>} />
            
            <Route path="/operations/mantisusers" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="mantis_users"><MantisUser /></PrivateRoute></Suspense>} />
            
            <Route path="/operations/zones-storage-mapping" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zone_storageMapping"><ZoneStorageMapping /></PrivateRoute></Suspense>} />
            <Route path="/operations/zones-storage-mapping/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zone_storageMapping"><AddZoneStorageMapping /></PrivateRoute></Suspense>} />
            <Route path="/operations/zones-storage-mapping/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zone_storageMapping"><StorageMappingDetails /></PrivateRoute></Suspense>} />
            <Route path="/operations/zones-storage-mapping/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_zone_storageMapping"><AddZoneStorageMapping /></PrivateRoute></Suspense>} />

            
            <Route path="operations/receipt-to-lane" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="receipt_to_lane"><ReceiptToLane /></PrivateRoute></Suspense>} />

            <Route path="operations/multiple-receipt-to-lane" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="receipt_to_lane"><MultipleReceiptToLane /></PrivateRoute></Suspense>} />

 
            {/* <Route path="operations/order-slot/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="receipt_to_lane"><OrderCreate /></PrivateRoute></Suspense>} /> */}



           
   

            
            
            {/* Order task */}
            <Route path="/operations/manage-orders-task" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_manageOrdersTask"><ManageOrderTask /></PrivateRoute></Suspense>} />
            <Route path="/operations/manage-shipment-location" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_shipment_location"><ManageShipmentLocationsGrid /></PrivateRoute></Suspense>} />


            <Route path="/operations/manage-shipment-location/create" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_shipment_location"><ManageShipmentLocations /></PrivateRoute></Suspense>} />
            <Route path="/operations/manage-shipment-location/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_shipment_location"><ManageShipmentLocations /></PrivateRoute></Suspense>} />

           <Route path="/operations/failed-jobs" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="failed_jobs_permission"><FailedJobs /></PrivateRoute></Suspense>} />
           <Route path="/operations/mix-putaway" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="mix-putaway"><MixReceiving /></PrivateRoute></Suspense>} />
            {/* <Route path="/operations/conveyor-slots" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="operations_conveyorSlots"><PutawayTaskCreation /></PrivateRoute></Suspense>} /> */}

            /////////////////////////////////////////////////////

            //////////////// Trucks /////////////////////////////
            <Route path="/truck-details" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="trucks_truckDetails"><TruckDetails /></PrivateRoute></Suspense>} />

            /////////////////////////////////////////////////////

            //////////////// Reports /////////////////////////////
            <Route path="/reports/view-report" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission=""><ViewReport /></PrivateRoute></Suspense>} />

                //////////////// Picklists /////////////////////////////
                <Route path="/reports/picklists" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_picklists"><PicklistsReports props="picklists" /></PrivateRoute></Suspense>} />
                /////////////////////////////////////////////////////   
                //////////////// Products /////////////////////////////
                <Route path="/reports/items" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_items"><ProductReports props="items" /></PrivateRoute></Suspense>} />
                /////////////////////////////////////////////////////   
                //////////////// Trucks /////////////////////////////
                <Route path="/reports/trucks" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_trucks"><TrucksReports /></PrivateRoute></Suspense>} />
                /////////////////////////////////////////////////////   

                /////////////////////////LOCATION////////////////////////////
                <Route path="/reports/locations" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_locations" ><LocationsReports props="Locations" /></PrivateRoute></Suspense>} />
                /////////////////////////ISSUES////////////////////////////
                <Route path="/reports/issues" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_issues"><IssuesReports  props="Issues"/></PrivateRoute></Suspense>} />
                /////////////////////////ORDERS////////////////////////////
                <Route path="/reports/orders" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_orders" ><OrdersReports props="Orders"/></PrivateRoute></Suspense>} />
                /////////////////////////RECIPTS////////////////////////////
                <Route path="/reports/receipts" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_receipt" ><ReceiptReports props="Receipts"/></PrivateRoute></Suspense>} />
                /////////////////////////STOCKS////////////////////////////
                <Route path="/reports/stocks" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="reports_stocks" ><StocksReports props="Stock"/></PrivateRoute></Suspense>} />
                
                
                //////////////// Setups /////////////////////////////
                
                //////////////// Reports /////////////////////////////
                <Route path="/setup/reports" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_reports"><SetupReports /></PrivateRoute></Suspense>} />
                <Route path="/setup/reports/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_reports"><AddSetupReport /></PrivateRoute></Suspense>} />
                <Route path="/setup/reports/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_reports"><SetupReportDetails /></PrivateRoute></Suspense>} />
                <Route path="/setup/reports/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_reports"><AddSetupReport /></PrivateRoute></Suspense>} />

                /////////////////////////////////////////////////////   
                //////////////// Item Conversion /////////////////////////////
                <Route path="/setup/item-conversion" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_itemConversion"><ItemConversion /></PrivateRoute></Suspense>} />
                <Route path="/setup/item-conversion/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_itemConversion"><AddItemConversion /></PrivateRoute></Suspense>} />
                <Route path="/setup/item-conversion/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_itemConversion"><ItemConversionDetails /></PrivateRoute></Suspense>} />
                <Route path="/setup/item-conversion/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_itemConversion"><AddItemConversion /></PrivateRoute></Suspense>} />

                /////////////////////////////////////////////////////   
                <Route path="/setup/user-types" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_itemConversion"><UserType /></PrivateRoute></Suspense>} />
                <Route path="/setup/user-types/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_itemConversion"><AddUserType /></PrivateRoute></Suspense>} />
                <Route path="/setup/user-types/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_itemConversion"><AddUserType /></PrivateRoute></Suspense>} />
                //////////////// Magae Trucks /////////////////////////////
                <Route path="/trucks/manage-trucks" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="manage_trucks"><ManageTrucks /></PrivateRoute></Suspense>} />  
                <Route path="/users" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="users"><AllUsers /></PrivateRoute></Suspense>} />  
                <Route path="/users/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="users_add"><CreateAllUsers /></PrivateRoute></Suspense>} />          
                <Route path="/trucks/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="manage_trucks"><AddTrucks /></PrivateRoute></Suspense>} />
                ///////////////////////////////////////////////////// 
                <Route path="/truck-shipments" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="manage_trucks"><TruckShipment /></PrivateRoute></Suspense>} />    

                //////////////// Lanes /////////////////////////////
                <Route path="/setup/lanes" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_lanes"><LanesSetup /></PrivateRoute></Suspense>} />
                <Route path="/setup/lanes/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_lanes"><AddLanesSetup /></PrivateRoute></Suspense>} />
                <Route path="/setup/lanes/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_lanes"><LanesSetupDetails /></PrivateRoute></Suspense>} />
                <Route path="/setup/lanes/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_lanes"><AddLanesSetup /></PrivateRoute></Suspense>} />
                <Route path="/setup/lanes/laneusers/:id/:name" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="setups_lanes"><UserLanesSetup /></PrivateRoute></Suspense>} />
                <Route path="/setup/color-mapping" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="color_mapping"><ColorMapping /></PrivateRoute></Suspense>} />
               
                /////////////////////////////////////////////////////  

            /////////////////////////////////////////////////////

            <Route path="/settings/schedulers" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_schedulers"><SchedulerSettings /></PrivateRoute></Suspense>} />

            <Route path="/settings/users" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_users"><Users /></PrivateRoute></Suspense>} />
            <Route path="/settings/users/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_users"><AddUser /></PrivateRoute></Suspense>} />
            <Route path="/settings/users/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_users"><UserDetails /></PrivateRoute></Suspense>} />
            <Route path="/settings/users/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_users"><AddUser /></PrivateRoute></Suspense>} />
             
             {/* Notification settings */}
            <Route path="/settings/notification-setting" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="notification_settings"><NotificationSettings /></PrivateRoute></Suspense>} />
            <Route path="/settings/notification-setting/view-log/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="notification_settings"><DynamicNotificationLogs /></PrivateRoute></Suspense>} />

            <Route path="/settings/roles" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_roles"><Roles /></PrivateRoute></Suspense>} />
            <Route path="/settings/roles/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_roles"><AddRole /></PrivateRoute></Suspense>} />
            <Route path="/settings/roles/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_roles"><RoleDetails /></PrivateRoute></Suspense>} />
            <Route path="/settings/roles/edit/:id" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="settings_roles"><AddRole /></PrivateRoute></Suspense>} />



            <Route path="/settings/conveyor-setting" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="conveyor-setting"><Getconveyor /></PrivateRoute></Suspense>} />
            <Route path="/settings/conveyor-setting/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="conveyor-setting"><Createconveyor /></PrivateRoute></Suspense>} />
            <Route path="/settings/conveyor-setting/edit/:id/:stn_Name" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="conveyor-setting"><Createconveyor /></PrivateRoute></Suspense>} />


            <Route path="/settings/log-setting" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="log-setting"><Log /></PrivateRoute></Suspense>} />
        //////////////////////////admin user///////////////////
         <Route path="/users/adminusers" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="admin_user"><AdminUsergrid /></PrivateRoute></Suspense>} /> 
        <Route path="/users/adminusers/add" element={<Suspense fallback={<PageSpinner />}><PrivateRoute permission="admin_user"><AdminUser /></PrivateRoute></Suspense>} />  

      </Routes>
    );
}
