import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface Attendance {
  'id' : string,
  'status' : string,
  'date' : string,
  'employeeId' : string,
  'inTime' : string,
  'outTime' : string,
  'shift' : string,
}
export interface DashboardStats {
  'totalEmployees' : bigint,
  'vendorDistribution' : Array<[string, bigint]>,
  'presentCount' : bigint,
  'shiftDistribution' : Array<[string, bigint]>,
  'attendancePercentage' : number,
  'absentCount' : bigint,
}
export interface Employee {
  'id' : string,
  'code' : string,
  'name' : string,
  'createdAt' : Time,
  'shift' : string,
  'vendorId' : string,
  'parentsName' : string,
  'phoneNumber' : string,
  'department' : string,
  'designation' : string,
  'joiningDate' : string,
  'photo' : string,
  'employeeType' : string,
  'inTime' : string,
  'outTime' : string,
}
export type Time = bigint;
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface Vendor {
  'id' : string,
  'name' : string,
  'gstNumber' : string,
  'contactPersonName' : string,
  'contactNumber' : string,
  'address' : string,
}
export interface AppUser {
  'id' : string,
  'permissions' : string,
  'username' : string,
  'password' : string,
  'role' : string,
}
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'addEmployee' : ActorMethod<[Employee], string>,
  'addVendor' : ActorMethod<[Vendor], string>,
  'appLogin' : ActorMethod<[string, string], [] | [AppUser]>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'changeAppPassword' : ActorMethod<[string, string, string], string>,
  'countEmployeesByVendor' : ActorMethod<[string], bigint>,
  'createAppUser' : ActorMethod<[string, string, AppUser], string>,
  'deleteAppUser' : ActorMethod<[string, string, string], string>,
  'deleteEmployee' : ActorMethod<[string], string>,
  'deleteVendor' : ActorMethod<[string], string>,
  'getAllAppUsers' : ActorMethod<[string, string], Array<AppUser>>,
  'getAllAttendance' : ActorMethod<[], Array<Attendance>>,
  'getAllEmployees' : ActorMethod<[], Array<Employee>>,
  'getAllVendors' : ActorMethod<[], Array<Vendor>>,
  'getAttendanceByDate' : ActorMethod<[string], Array<Attendance>>,
  'getAttendanceByEmployee' : ActorMethod<[string], Array<Attendance>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getDashboardStats' : ActorMethod<[string], DashboardStats>,
  'getEmployee' : ActorMethod<[string], Employee>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'getVendor' : ActorMethod<[string], Vendor>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'markAttendance' : ActorMethod<[Attendance], string>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'updateAppUser' : ActorMethod<[string, string, AppUser], string>,
  'updateAttendance' : ActorMethod<[Attendance], string>,
  'updateEmployee' : ActorMethod<[Employee], string>,
  'updateVendor' : ActorMethod<[Vendor], string>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
