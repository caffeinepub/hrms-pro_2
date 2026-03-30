import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Attendance {
    id: string;
    status: string;
    date: string;
    employeeId: string;
    inTime: string;
    outTime: string;
    shift: string;
}
export interface Employee {
    id: string;
    code: string;
    name: string;
    createdAt: Time;
    shift: string;
    vendorId: string;
    parentsName: string;
    phoneNumber: string;
    department: string;
    designation: string;
    joiningDate: string;
    photo: string;
    employeeType: string;
    inTime: string;
    outTime: string;
}
export interface Vendor {
    id: string;
    name: string;
    gstNumber: string;
    contactPersonName: string;
    contactNumber: string;
    address: string;
}
export interface DashboardStats {
    totalEmployees: bigint;
    vendorDistribution: Array<[string, bigint]>;
    presentCount: bigint;
    shiftDistribution: Array<[string, bigint]>;
    attendancePercentage: number;
    absentCount: bigint;
}
export interface UserProfile {
    name: string;
}
export interface AppUser {
    id: string;
    username: string;
    password: string;
    role: string;
    permissions: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    // App-level auth
    appLogin(username: string, password: string): Promise<AppUser | null>;
    createAppUser(adminUsername: string, adminPassword: string, newUser: AppUser): Promise<string>;
    getAllAppUsers(adminUsername: string, adminPassword: string): Promise<Array<AppUser>>;
    updateAppUser(adminUsername: string, adminPassword: string, user: AppUser): Promise<string>;
    deleteAppUser(adminUsername: string, adminPassword: string, id: string): Promise<string>;
    changeAppPassword(username: string, oldPassword: string, newPassword: string): Promise<string>;
    // Vendors
    addVendor(vendor: Vendor): Promise<string>;
    updateVendor(vendor: Vendor): Promise<string>;
    deleteVendor(id: string): Promise<void>;
    getAllVendors(): Promise<Array<Vendor>>;
    getVendor(id: string): Promise<Vendor | null>;
    countEmployeesByVendor(vendorId: string): Promise<bigint>;
    // Employees
    addEmployee(employee: Employee): Promise<string>;
    updateEmployee(employee: Employee): Promise<string>;
    deleteEmployee(id: string): Promise<void>;
    getAllEmployees(): Promise<Array<Employee>>;
    getEmployee(id: string): Promise<Employee>;
    // Attendance
    markAttendance(attendance: Attendance): Promise<void>;
    updateAttendance(attendance: Attendance): Promise<void>;
    getAllAttendance(): Promise<Array<Attendance>>;
    getAttendanceByDate(date: string): Promise<Array<Attendance>>;
    getAttendanceByEmployee(employeeId: string): Promise<Array<Attendance>>;
    // Dashboard
    getDashboardStats(date: string): Promise<DashboardStats>;
    // II user profile (kept for compatibility)
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
