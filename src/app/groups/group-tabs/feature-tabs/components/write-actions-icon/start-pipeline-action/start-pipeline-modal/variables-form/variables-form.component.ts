
import { Component, DestroyRef, inject, OnInit, output } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzFormModule } from 'ng-zorro-antd/form'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { filter } from 'rxjs'

const MAX_FORM_FIELDS = 15

type Variable = { key: string; value: string }

@Component({
  selector: 'gcd-variables-form',
  imports: [NzButtonModule, NzIconModule, NzFormModule, ReactiveFormsModule],
  templateUrl: './variables-form.component.html',
  styleUrls: ['./variables-form.component.scss']
})
export class VariablesFormComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder)
  private destroyRef = inject(DestroyRef)

  onChange = output<Record<string, string>>()

  formGroup = this.formBuilder.group({
    [this.formArray]: this.formBuilder.array<Variable[]>([])
  })

  get formArray() {
    return 'variables'
  }

  get variables(): FormArray {
    return this.formGroup.get(this.formArray) as FormArray
  }

  get canAddVariables() {
    return this.variables.length < MAX_FORM_FIELDS
  }

  ngOnInit(): void {
    this.variables.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.variables.valid)
      )
      .subscribe((variables: Variable[]) => {
        const vars = variables.reduce((prev, { key, value }) => {
          return {
            ...prev,
            [key]: value
          }
        }, Object())

        this.onChange.emit(vars)
      })
  }

  addVariables(e: MouseEvent) {
    e.preventDefault()

    this.variables.push(
      this.formBuilder.group({
        key: ['', Validators.required],
        value: ['', Validators.required]
      })
    )
  }

  removeVariables(index: number, e: MouseEvent) {
    e.preventDefault()

    this.variables.removeAt(index)
  }
}
