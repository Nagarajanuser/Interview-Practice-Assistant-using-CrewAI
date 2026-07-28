class InterviewSessionNotFoundException(Exception):
    def __init__(self, session_id: str):
        self.session_id = session_id
        super().__init__(f"Interview session '{session_id}' was not found.")

class InterviewGenerationException(Exception):
    def __init__(self, message: str):
        super().__init__(message)
