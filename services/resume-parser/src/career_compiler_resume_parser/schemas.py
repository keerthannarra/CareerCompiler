from typing import List, Optional
from pydantic import BaseModel, Field

class ParsedContact(BaseModel):
    name: Optional[str] = Field(None, description="Full name of the candidate")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL")
    github: Optional[str] = Field(None, description="GitHub profile URL")
    website: Optional[str] = Field(None, description="Personal website URL")
    location: Optional[str] = Field(None, description="City, State, or Country")

class ParsedBullet(BaseModel):
    text: str = Field(default="", description="A single bullet point describing an achievement or responsibility")

class ParsedDateRange(BaseModel):
    start: Optional[str] = Field(default="", description="Start date (e.g., 'Jan 2020')")
    end: Optional[str] = Field(default="", description="End date (e.g., 'Present' or 'Dec 2022')")
    raw: Optional[str] = Field(default="", description="The raw date string from the resume")

class ParsedEntry(BaseModel):
    title: Optional[str] = Field(default="", description="Degree, job title, or project name")
    organization: Optional[str] = Field(default="", description="Institute, company, or university name")
    location: Optional[str] = Field(default="", description="Location of the entry")
    subtitle: Optional[str] = Field(default="", description="Specialization, supervisor, or sub-details")
    gpa: Optional[str] = Field(default="", description="CPI, GPA, or percentage if present (e.g. '9.25' or '10.0')")
    dates: Optional[ParsedDateRange] = Field(default=None, description="Start and end dates")
    bullets: List[ParsedBullet] = Field(default_factory=list)

class ParsedSection(BaseModel):
    name: Optional[str] = Field(default="Experience", description="Original section name (e.g., 'Professional Experience', 'Education', 'Positions of Responsibility', 'Achievements')")
    normalized_name: Optional[str] = Field(default="experience", description="Normalized section name (one of: experience, education, projects, leadership, achievements, certifications, summary)")
    entries: List[ParsedEntry] = Field(default_factory=list)

class ParsedSkillItem(BaseModel):
    name: Optional[str] = Field(default="", description="Name of the skill")
    normalized: Optional[str] = Field(default="", description="Lowercase, standardized name of the skill")

class ParsedSkillGroup(BaseModel):
    category: Optional[str] = Field(default="Technical Skills", description="Category of skills (e.g., 'Languages', 'Frameworks')")
    items: List[ParsedSkillItem] = Field(default_factory=list)

class ParsedProfile(BaseModel):
    contact: Optional[ParsedContact] = None
    sections: List[ParsedSection] = Field(default_factory=list)
    skills: List[ParsedSkillGroup] = Field(default_factory=list)
