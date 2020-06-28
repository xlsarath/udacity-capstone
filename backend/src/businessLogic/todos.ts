import { TodoAccess } from '../dataLayer/todosAccess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as AuthUtils from '../auth/utils'

const todoAccess = new TodoAccess()

export async function getAllTodoItems(jwtToken: string): Promise<TodoItem[]> {
    const userId = AuthUtils.parseUserId(jwtToken)
    return await todoAccess.getAllTodoItemsForUser(userId)
}

export async function createNewTodoItem(createTodoRequest: CreateTodoRequest, jwtToken: string): Promise<TodoItem> {
    const userId = AuthUtils.parseUserId(jwtToken)
    return await todoAccess.createNewTodoItem(createTodoRequest, userId)
}

export async function updateTodoItem(updateTodoRequest: UpdateTodoRequest, todoId: string, jwtToken: string): Promise<TodoItem> {
    const userId = AuthUtils.parseUserId(jwtToken)
    return await todoAccess.updateTodoItem(updateTodoRequest, todoId, userId)
}

export async function deleteTodoItem(todoId: string, jwtToken: string) {
    const userId = AuthUtils.parseUserId(jwtToken)
    await todoAccess.deleteTodoItem(todoId, userId)
}

export async function generateUploadUrl(todoId: string): Promise<string> {
    return await todoAccess.generateUploadUrl(todoId)
}