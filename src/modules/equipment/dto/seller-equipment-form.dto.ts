import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class BasicDetailsDto {
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  engineHours?: string;

  @IsOptional()
  @IsString()
  mileage?: string;
}
export class GeneralDto {
  @IsOptional()
  @IsString()
  grossPower?: string;

  @IsOptional()
  @IsString()
  operatingWeight?: string;

  @IsOptional()
  @IsString()
  tireTrackSize?: string;

  @IsOptional()
  @IsString()
  suspension?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  engineType?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  cabType?: string;

  @IsOptional()
  @IsString()
  tireTrackWear?: string;
}
export class ConditionDto {
  @IsOptional()
  @IsString()
  overallCondition?: string;

  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @IsOptional()
  @IsString()
  interiorColor?: string;

  @IsOptional()
  @IsBoolean()
  batteriesHoldCharge?: boolean;

  @IsOptional()
  @IsBoolean()
  jumpStartRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  parkingBrakeWorks?: boolean;
}
export class EngineConditionDto {
  @IsOptional()
  @IsString()
  overAllCondition?: string;

  @IsOptional()
  @IsBoolean()
  oilLevelOk?: boolean;

  @IsOptional()
  @IsBoolean()
  anyLeaks?: boolean;

  @IsOptional()
  @IsString()
  coolantLevel?: string;

  @IsOptional()
  @IsString()
  smokeColor?: string;

  @IsOptional()
  @IsString()
  engineNoise?: string;

  @IsOptional()
  @IsString()
  coldStartQuality?: string;

  @IsOptional()
  @IsBoolean()
  checkEngineLight?: boolean;
}
export class HydraulicsDto {
  @IsOptional()
  @IsString()
  hydraulicPumpCondition?: string;

  @IsOptional()
  @IsBoolean()
  cylinderLeaks?: boolean;

  @IsOptional()
  @IsString()
  hoseCondition?: string;

  @IsOptional()
  @IsString()
  hydraulicResponse?: string;

  @IsOptional()
  @IsBoolean()
  hydraulicsDamage?: boolean;
}
export class CabElectronicsDto {
  @IsOptional()
  @IsBoolean()
  dashboardFunctional?: boolean;

  @IsOptional()
  @IsBoolean()
  acHeaterWorking?: boolean;

  @IsOptional()
  @IsBoolean()
  displayErrors?: boolean;

  @IsOptional()
  @IsString()
  seatCondition?: string;

  @IsOptional()
  @IsBoolean()
  controlsWorking?: boolean;

  @IsOptional()
  @IsBoolean()
  lightsWorking?: boolean;

  @IsOptional()
  @IsBoolean()
  sensorsWorking?: boolean;
}
export class ExteriorDto {
  @IsOptional()
  @IsString()
  bodyPanels?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bodyPanelsImages?: string[];

  @IsOptional()
  @IsString()
  glassMirrors?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  glassMirrorsImages?: string[];

  @IsOptional()
  @IsString()
  lightsSignals?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lightsSignalsImages?: string[];
}
export class EngineDto {
  @IsOptional()
  @IsString()
  engineBlock?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  engineBlockImages?: string[];

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  transmissionImages?: string[];
}
export class HydraulicsChecklistDto {
  @IsOptional()
  @IsString()
  hydraulicPump?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hydraulicPumpImages?: string[];

  @IsOptional()
  @IsString()
  cylinders?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cylindersImages?: string[];
}
export class UnderCarriageDto {
  @IsOptional()
  @IsString()
  tracksWheels?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tracksWheelsImages?: string[];

  @IsOptional()
  @IsString()
  suspension?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suspensionImages?: string[];
}
export class FunctionalTestDto {
  @IsOptional()
  @IsString()
  engineStart?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  engineStartImages?: string[];

  @IsOptional()
  @IsString()
  operationTest?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operationTestImages?: string[];
}
export class MediaDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exteriorImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  engineCompartMentImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  underCarriageTracksImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cabInteriorImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherAttachments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];
}
export class EquipmentIdentityDto {
  @IsOptional()
  @IsString()
  vinNumber?: string;

  @IsOptional()
  @IsString()
  manufacturerDate?: string;

  @IsOptional()
  @IsBoolean()
  modelYearConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  equipmentHasDamage?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceRecords?: boolean;

  @IsOptional()
  @IsBoolean()
  warrantyAvailable?: boolean;
}
export class OwnershipDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownershipProof?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invoiceBillOfSale?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  governmentRegistration?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emissionTest?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  insurance?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  maintenanceLog?: string[];
}
