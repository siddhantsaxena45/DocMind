from pydantic import BaseModel

class UserRequest(BaseModel):
    username: str


class SignupRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str

class QueryRequest(BaseModel):
    user_id: str
    document_id: str
    text: str
