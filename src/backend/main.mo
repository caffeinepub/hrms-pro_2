import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller = _ }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // ---- App-level User Auth (username/password) ----
  public type AppUser = {
    id : Text;
    username : Text;
    password : Text;
    role : Text;        // "admin" | "user"
    permissions : Text; // "edit" | "view"
  };

  let appUsers = Map.empty<Text, AppUser>();

  // Seed default admin on first deploy
  do {
    if (appUsers.size() == 0) {
      appUsers.add("user-admin", {
        id = "user-admin";
        username = "admin";
        password = "admin123";
        role = "admin";
        permissions = "edit";
      });
    };
  };

  func findAppUser(username : Text, password : Text) : ?AppUser {
    for (u in appUsers.values()) {
      if (u.username == username and u.password == password) return ?u;
    };
    null;
  };

  public query func appLogin(username : Text, password : Text) : async ?AppUser {
    findAppUser(username, password);
  };

  public shared func createAppUser(adminUsername : Text, adminPassword : Text, newUser : AppUser) : async Text {
    switch (findAppUser(adminUsername, adminPassword)) {
      case (null) Runtime.trap("Unauthorized: Invalid credentials");
      case (?admin) {
        if (admin.role != "admin") Runtime.trap("Unauthorized: Must be admin");
        for (u in appUsers.values()) {
          if (u.username == newUser.username) Runtime.trap("Username already exists");
        };
        appUsers.add(newUser.id, newUser);
        "User created";
      };
    };
  };

  public query func getAllAppUsers(adminUsername : Text, adminPassword : Text) : async [AppUser] {
    switch (findAppUser(adminUsername, adminPassword)) {
      case (null) Runtime.trap("Unauthorized: Invalid credentials");
      case (?admin) {
        if (admin.role != "admin") Runtime.trap("Unauthorized: Must be admin");
        appUsers.values().toArray();
      };
    };
  };

  public shared func updateAppUser(adminUsername : Text, adminPassword : Text, user : AppUser) : async Text {
    switch (findAppUser(adminUsername, adminPassword)) {
      case (null) Runtime.trap("Unauthorized: Invalid credentials");
      case (?admin) {
        if (admin.role != "admin") Runtime.trap("Unauthorized: Must be admin");
        if (not appUsers.containsKey(user.id)) Runtime.trap("User not found");
        for (u in appUsers.values()) {
          if (u.username == user.username and u.id != user.id) Runtime.trap("Username already taken");
        };
        appUsers.add(user.id, user);
        "User updated";
      };
    };
  };

  public shared func deleteAppUser(adminUsername : Text, adminPassword : Text, id : Text) : async Text {
    switch (findAppUser(adminUsername, adminPassword)) {
      case (null) Runtime.trap("Unauthorized: Invalid credentials");
      case (?admin) {
        if (admin.role != "admin") Runtime.trap("Unauthorized: Must be admin");
        if (id == "user-admin") Runtime.trap("Cannot delete the default admin");
        if (not appUsers.containsKey(id)) Runtime.trap("User not found");
        appUsers.remove(id);
        "User deleted";
      };
    };
  };

  public shared func changeAppPassword(username : Text, oldPassword : Text, newPassword : Text) : async Text {
    for (u in appUsers.values()) {
      if (u.username == username and u.password == oldPassword) {
        appUsers.add(u.id, { u with password = newPassword });
        return "Password changed";
      };
    };
    Runtime.trap("Invalid credentials");
  };

  // ---- Vendor/Company CRUD ----

  type VendorV1 = { id : Text; name : Text };

  type Vendor = {
    id : Text;
    name : Text;
    gstNumber : Text;
    contactPersonName : Text;
    contactNumber : Text;
    address : Text;
  };

  let vendors : Map.Map<Text, VendorV1> = Map.empty<Text, VendorV1>();
  let vendorsV2 : Map.Map<Text, Vendor> = Map.empty<Text, Vendor>();
  var vendorsMigrated : Bool = false;

  system func postupgrade() {
    if (not vendorsMigrated) {
      for (v in vendors.values()) {
        vendorsV2.add(v.id, {
          id = v.id;
          name = v.name;
          gstNumber = "";
          contactPersonName = "";
          contactNumber = "";
          address = "";
        });
      };
      vendorsMigrated := true;
    };
    // Migrate employees V1 -> V2
    if (not employeesMigrated) {
      for (emp in employees.values()) {
        employeesV2.add(emp.id, {
          id = emp.id;
          name = emp.name;
          code = emp.code;
          vendorId = emp.vendorId;
          shift = emp.shift;
          createdAt = emp.createdAt;
          parentsName = "";
          phoneNumber = "";
          department = "";
          designation = "";
          joiningDate = "";
          photo = "";
        });
      };
      employeesMigrated := true;
    };
    // Migrate employees V2 -> V3
    if (not employeesV3Migrated) {
      for (emp in employeesV2.values()) {
        employeesV3.add(emp.id, {
          id = emp.id;
          name = emp.name;
          code = emp.code;
          vendorId = emp.vendorId;
          shift = emp.shift;
          createdAt = emp.createdAt;
          parentsName = emp.parentsName;
          phoneNumber = emp.phoneNumber;
          department = emp.department;
          designation = emp.designation;
          joiningDate = emp.joiningDate;
          photo = emp.photo;
          employeeType = "Permanent";
          inTime = "";
          outTime = "";
        });
      };
      employeesV3Migrated := true;
    };
    // Migrate attendance V1 (attendanceRecords) -> active records
    if (not attendanceMigrated) {
      for (a in attendanceRecords.values()) {
        attendanceActiveRecords.add(a.id, {
          id = a.id;
          employeeId = a.employeeId;
          date = a.date;
          status = a.status;
          inTime = "";
          outTime = "";
          shift = "";
        });
      };
      attendanceMigrated := true;
    };
  };

  public shared func addVendor(vendor : Vendor) : async Text {
    if (vendorsV2.containsKey(vendor.id)) Runtime.trap("Vendor id already exists");
    vendorsV2.add(vendor.id, vendor); "Vendor added";
  };

  public shared func updateVendor(vendor : Vendor) : async Text {
    if (not vendorsV2.containsKey(vendor.id)) Runtime.trap("Vendor not found");
    vendorsV2.add(vendor.id, vendor); "Vendor updated";
  };

  public shared func deleteVendor(id : Text) : async () {
    if (not vendorsV2.containsKey(id)) Runtime.trap("Vendor not found");
    vendorsV2.remove(id);
  };

  public query func getAllVendors() : async [Vendor] {
    vendorsV2.values().toArray().sort(func(a : Vendor, b : Vendor) : Order.Order { Text.compare(a.id, b.id) });
  };

  public query func getVendor(id : Text) : async ?Vendor {
    vendorsV2.get(id);
  };

  public query func countEmployeesByVendor(vendorId : Text) : async Nat {
    var count = 0;
    for (emp in employeesV3.values()) { if (emp.vendorId == vendorId) count += 1 };
    count;
  };

  // ---- Employee CRUD ----

  type EmployeeV1 = { id : Text; name : Text; code : Text; vendorId : Text; shift : Text; createdAt : Time.Time };

  type EmployeeV2 = {
    id : Text;
    name : Text;
    code : Text;
    vendorId : Text;
    shift : Text;
    createdAt : Time.Time;
    parentsName : Text;
    phoneNumber : Text;
    department : Text;
    designation : Text;
    joiningDate : Text;
    photo : Text;
  };

  type Employee = {
    id : Text;
    name : Text;
    code : Text;
    vendorId : Text;
    shift : Text;
    createdAt : Time.Time;
    parentsName : Text;
    phoneNumber : Text;
    department : Text;
    designation : Text;
    joiningDate : Text;
    photo : Text;
    employeeType : Text;
    inTime : Text;
    outTime : Text;
  };

  module Employee {
    public func compare(a : Employee, b : Employee) : Order.Order { Text.compare(a.id, b.id) };
  };

  let employees : Map.Map<Text, EmployeeV1> = Map.empty<Text, EmployeeV1>();
  let employeesV2 : Map.Map<Text, EmployeeV2> = Map.empty<Text, EmployeeV2>();
  var employeesMigrated : Bool = false;
  let employeesV3 : Map.Map<Text, Employee> = Map.empty<Text, Employee>();
  var employeesV3Migrated : Bool = false;

  public shared func addEmployee(employee : Employee) : async Text {
    if (employeesV3.containsKey(employee.id)) Runtime.trap("Employee id already exists");
    for (emp in employeesV3.values()) {
      if (emp.code == employee.code) Runtime.trap("Employee code already exists");
    };
    employeesV3.add(employee.id, employee); "Employee added";
  };

  public shared func updateEmployee(employee : Employee) : async Text {
    if (not employeesV3.containsKey(employee.id)) Runtime.trap("Employee not found");
    for (emp in employeesV3.values()) {
      if (emp.code == employee.code and emp.id != employee.id) Runtime.trap("Employee code already exists");
    };
    employeesV3.add(employee.id, employee); "Employee updated";
  };

  public shared func deleteEmployee(id : Text) : async () {
    if (not employeesV3.containsKey(id)) Runtime.trap("Employee not found");
    employeesV3.remove(id);
  };

  public query func getEmployee(id : Text) : async Employee {
    switch (employeesV3.get(id)) {
      case (null) Runtime.trap("Employee not found");
      case (?e) e;
    };
  };

  public query func getAllEmployees() : async [Employee] {
    employeesV3.values().toArray().sort();
  };

  // ---- Attendance ----
  // Original deployed stable var — kept with original type to avoid compatibility errors
  type AttendanceV1 = { id : Text; employeeId : Text; date : Text; status : Text };
  let attendanceRecords : Map.Map<Text, AttendanceV1> = Map.empty<Text, AttendanceV1>();

  // Current type with inTime, outTime, shift
  type Attendance = { id : Text; employeeId : Text; date : Text; status : Text; inTime : Text; outTime : Text; shift : Text };
  module Attendance {
    public func compare(a : Attendance, b : Attendance) : Order.Order { Text.compare(a.id, b.id) };
  };

  let attendanceActiveRecords : Map.Map<Text, Attendance> = Map.empty<Text, Attendance>();
  var attendanceMigrated : Bool = false;

  public shared func markAttendance(attendance : Attendance) : async () {
    if (not employeesV3.containsKey(attendance.employeeId)) Runtime.trap("Employee not found");
    attendanceActiveRecords.add(attendance.id, attendance);
  };

  public shared func updateAttendance(attendance : Attendance) : async () {
    if (not attendanceActiveRecords.containsKey(attendance.id)) Runtime.trap("Attendance record not found");
    if (not employeesV3.containsKey(attendance.employeeId)) Runtime.trap("Employee not found");
    attendanceActiveRecords.add(attendance.id, attendance);
  };

  public query func getAllAttendance() : async [Attendance] {
    attendanceActiveRecords.values().toArray().sort();
  };

  public query func getAttendanceByDate(date : Text) : async [Attendance] {
    attendanceActiveRecords.values().toArray().filter(func(a : Attendance) : Bool { a.date == date }).sort();
  };

  public query func getAttendanceByEmployee(employeeId : Text) : async [Attendance] {
    attendanceActiveRecords.values().toArray().filter(func(a : Attendance) : Bool { a.employeeId == employeeId }).sort();
  };

  // ---- Dashboard ----
  public type DashboardStats = {
    totalEmployees : Nat;
    presentCount : Nat;
    absentCount : Nat;
    vendorDistribution : [(Text, Nat)];
    shiftDistribution : [(Text, Nat)];
    attendancePercentage : Float;
  };

  public query func getDashboardStats(date : Text) : async DashboardStats {
    let totalEmployees = employeesV3.size();
    var presentCount = 0;
    var absentCount = 0;
    for (a in attendanceActiveRecords.values()) {
      if (a.date == date) {
        if (a.status == "Present") presentCount += 1
        else if (a.status == "Absent") absentCount += 1;
      };
    };
    let vendorMap = Map.empty<Text, Nat>();
    for (emp in employeesV3.values()) {
      let c = switch (vendorMap.get(emp.vendorId)) { case (null) 0; case (?n) n };
      vendorMap.add(emp.vendorId, c + 1);
    };
    let shiftMap = Map.empty<Text, Nat>();
    for (emp in employeesV3.values()) {
      let c = switch (shiftMap.get(emp.shift)) { case (null) 0; case (?n) n };
      shiftMap.add(emp.shift, c + 1);
    };
    let totalMarked = presentCount + absentCount;
    let attendancePercentage = if (totalMarked > 0) (presentCount.toFloat() / totalMarked.toFloat()) * 100.0 else 0.0;
    {
      totalEmployees;
      presentCount;
      absentCount;
      vendorDistribution = vendorMap.entries().toArray();
      shiftDistribution = shiftMap.entries().toArray();
      attendancePercentage;
    };
  };
};
