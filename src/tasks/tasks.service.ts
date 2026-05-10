import { Injectable } from '@nestjs/common';
import { Task, TaskStatus } from './task.model';
import { v4 as uuid } from 'uuid';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  public getAllTasks(): Task[] {
    return this.tasks;
  }

  public getTaskById(id: string): Task | undefined {
    const task = this.tasks.find((task) => task.id === id);
    if (!task) return undefined;
    return task;
  }

  public getTasksWithFilter(filterDto: GetTaskFilterDto): Task[] {
    const { status, search } = filterDto;
    // Define a temporary
    let tasks = this.getAllTasks();

    // 1. status
    if (status) {
      // ........
      tasks = tasks.filter((task) => task.status === status);
    }

    // 2.search
    if (search) {
      tasks = tasks.filter((task) => {
        if (task.title.includes(search) || task.description.includes(search)) {
          return true;
        }
        return false;
      });
    }

    // Return filtered Tasks
    return tasks;
  }

  public createTask(createTaskDto: CreateTaskDto): Task {
    const { title, description } = createTaskDto;
    const task: Task = {
      id: uuid(),
      title,
      description,
      status: TaskStatus.OPEN,
    };

    this.tasks.push(task);
    return task;
  }

  public deleteTaskById(id: string): object {
    const newTasks = this.tasks.filter((task) => task.id != id);
    if (newTasks.length === this.tasks.length) {
      return {
        statusCode: 404,
        error: 'TASK NOT FOUND',
        data: {},
      };
    }

    this.tasks = newTasks;
    return {
      code: 200,
      status: 'SUCCESS DELETE TASK',
      data: {},
    };
  }

  public updateTaskByid(id: string, newStatus: TaskStatus): Task | string {
    const task = this.getTaskById(id);
    if (!task) {
      return 'Task Not Found!';
    }

    task.status = newStatus;
    return task;
  }
}
