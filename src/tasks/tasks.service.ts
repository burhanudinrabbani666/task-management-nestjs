import { Injectable } from '@nestjs/common';
import { Task, TaskStatus } from './task.model';
import { v4 as uuid } from 'uuid';
import { CreateTaskDto } from './dto/create-task.dto';

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

  public updateTaskByid(id: string, newStatus: string): Task | string {
    const isValid = Object.values(TaskStatus).includes(newStatus as TaskStatus);
    if (!isValid) {
      return 'status not valid. should be:  OPEN or IN_PROGRESS or DONE';
    }

    const task = this.tasks.find((task) => task.id === id);
    if (!task) {
      return 'Task Not Found';
    }

    const newTaskStatus: TaskStatus = newStatus.toUpperCase() as TaskStatus;
    const updatedTask: Task = {
      ...task,
      status: newTaskStatus,
    };

    this.tasks = this.tasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task,
    );

    return updatedTask;
  }
}
